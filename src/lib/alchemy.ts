import { enrichActivityDisplay } from "@/lib/portfolio-aggregate";
import type { PortfolioActivity } from "@/lib/portfolio-wallet-types";

const MAINNET_NETWORKS = [
  "eth-mainnet",
  "base-mainnet",
  "arb-mainnet",
  "opt-mainnet",
  "polygon-mainnet",
] as const;

const TESTNET_NETWORKS = ["eth-sepolia", "base-sepolia"] as const;

const NETWORK_CHAIN: Record<string, string> = {
  "eth-mainnet": "ethereum",
  "eth-sepolia": "ethereum-sepolia",
  "base-mainnet": "base",
  "base-sepolia": "base-sepolia",
  "arb-mainnet": "arbitrum",
  "opt-mainnet": "optimism",
  "polygon-mainnet": "polygon",
};

const CHAIN_LABEL: Record<string, string> = {
  ethereum: "Ethereum",
  "ethereum-sepolia": "Ethereum Sepolia",
  base: "Base",
  "base-sepolia": "Base Sepolia",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
};

type AlchemyTransfer = {
  blockNum?: string;
  hash?: string;
  from?: string;
  to?: string;
  value?: number | null;
  asset?: string | null;
  category?: string;
  rawContract?: { address?: string; decimal?: string; value?: string };
  metadata?: { blockTimestamp?: string };
};

type AlchemyTransfersResult = {
  transfers?: AlchemyTransfer[];
  pageKey?: string;
};

export function isAlchemyConfigured(): boolean {
  return Boolean(process.env.ALCHEMY_API_KEY?.trim());
}

function alchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY?.trim();
  if (!key) throw new Error("ALCHEMY_API_KEY is not configured");
  return key;
}

async function alchemyRpc<T>(
  network: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(`https://${network}.g.alchemy.com/v2/${alchemyKey()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alchemy ${network} ${res.status}: ${text.slice(0, 160)}`);
  }

  const json = (await res.json()) as { result?: T; error?: { message?: string } };
  if (json.error?.message) {
    throw new Error(`Alchemy ${network}: ${json.error.message.slice(0, 160)}`);
  }
  return json.result as T;
}

async function fetchDirectionTransfers(
  network: string,
  address: string,
  direction: "from" | "to",
): Promise<AlchemyTransfer[]> {
  const field = direction === "from" ? "fromAddress" : "toAddress";
  const result = await alchemyRpc<AlchemyTransfersResult>(
    network,
    "alchemy_getAssetTransfers",
    [
      {
        [field]: address,
        category: ["external", "erc20", "erc721", "erc1155"],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: "0x28",
        order: "desc",
      },
    ],
  );
  return result?.transfers ?? [];
}

function transferToActivity(
  network: string,
  transfer: AlchemyTransfer,
  wallet: string,
): PortfolioActivity | null {
  const hash = transfer.hash;
  if (!hash) return null;

  const chainId = NETWORK_CHAIN[network] ?? network;
  const walletLc = wallet.toLowerCase();
  const from = transfer.from?.toLowerCase() ?? "";
  const to = transfer.to?.toLowerCase() ?? "";
  const direction: "in" | "out" | undefined =
    to === walletLc ? "in" : from === walletLc ? "out" : undefined;

  const category = transfer.category ?? "execute";
  const asset = transfer.asset ?? (category === "external" ? "ETH" : "Token");
  const type =
    category === "external"
      ? direction === "in"
        ? "receive"
        : "send"
      : category;

  const activity: PortfolioActivity = {
    id: `alchemy-${network}-${hash}-${asset}`,
    hash,
    chain: CHAIN_LABEL[chainId] ?? chainId,
    chainId,
    type,
    label: `${direction === "in" ? "Receive" : direction === "out" ? "Send" : "Transfer"} · ${asset}`,
    timestamp: transfer.metadata?.blockTimestamp ?? new Date().toISOString(),
    amount:
      transfer.value != null
        ? String(transfer.value)
        : transfer.rawContract?.value,
    assetSymbol: asset,
    isSpam: false,
    direction,
    appName: "Alchemy",
  };

  return enrichActivityDisplay(activity);
}

export async function getWalletTransactionsAlchemy(
  address: string,
  testnet: boolean,
): Promise<PortfolioActivity[]> {
  const networks = testnet ? [...TESTNET_NETWORKS] : [...MAINNET_NETWORKS];
  const batches = await Promise.all(
    networks.map(async (network) => {
      try {
        const [incoming, outgoing] = await Promise.all([
          fetchDirectionTransfers(network, address, "to"),
          fetchDirectionTransfers(network, address, "from"),
        ]);
        return [...incoming, ...outgoing]
          .map((t) => transferToActivity(network, t, address))
          .filter((a): a is PortfolioActivity => a != null);
      } catch {
        return [] as PortfolioActivity[];
      }
    }),
  );

  const seen = new Set<string>();
  const merged: PortfolioActivity[] = [];
  for (const item of batches.flat()) {
    const key = `${item.hash}:${item.assetSymbol ?? ""}:${item.chainId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  merged.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return merged.slice(0, 80);
}
