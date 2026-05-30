import { resolveTokenLogo } from "@/lib/token-visuals";
import type { PortfolioAsset } from "@/lib/portfolio-wallet-types";
import { capUsd } from "@/lib/portfolio-valuation";
import { formatQuantityDisplay } from "@/lib/portfolio-display";

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

const MAINNET_CHAINS = [
  "eth",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "bsc",
  "avalanche",
  "linea",
  "scroll",
] as const;

const TESTNET_CHAINS = ["sepolia", "base sepolia"] as const;

const CHAIN_DISPLAY: Record<string, string> = {
  eth: "Ethereum",
  sepolia: "Ethereum Sepolia",
  base: "Base",
  "base sepolia": "Base Sepolia",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  bsc: "BNB Chain",
  avalanche: "Avalanche",
  linea: "Linea",
  scroll: "Scroll",
};

export type MoralisTokenBalance = {
  token_address?: string;
  symbol?: string;
  name?: string;
  logo?: string | null;
  thumbnail?: string | null;
  decimals?: number;
  balance?: string;
  balance_formatted?: string;
  usd_price?: number | null;
  usd_value?: number | null;
  usd_price_24hr_percent_change?: number | null;
  native_token?: boolean;
  possible_spam?: boolean;
  verified_contract?: boolean;
};

type MoralisTokensResponse = {
  result?: MoralisTokenBalance[];
  cursor?: string | null;
};

function moralisHeaders(): HeadersInit {
  const key = process.env.MORALIS_API_KEY?.trim();
  if (!key) throw new Error("MORALIS_API_KEY is not configured");
  return {
    accept: "application/json",
    "X-API-Key": key,
  };
}

export function isMoralisConfigured(): boolean {
  return Boolean(process.env.MORALIS_API_KEY?.trim());
}

async function fetchMoralisTokensPage(
  address: string,
  chain: string,
  cursor?: string,
): Promise<MoralisTokensResponse> {
  const params = new URLSearchParams({
    chain,
    limit: "100",
    exclude_spam: "true",
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(
    `${MORALIS_BASE}/wallets/${address}/tokens?${params.toString()}`,
    { headers: moralisHeaders(), cache: "no-store" },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moralis API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<MoralisTokensResponse>;
}

export async function getWalletTokensForChain(
  address: string,
  chain: string,
): Promise<MoralisTokenBalance[]> {
  const items: MoralisTokenBalance[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 5; page++) {
    const data = await fetchMoralisTokensPage(address, chain, cursor);
    items.push(...(data.result ?? []));
    cursor = data.cursor ?? undefined;
    if (!cursor) break;
  }

  return items;
}

export type MoralisTokenWithChain = {
  chain: string;
  token: MoralisTokenBalance;
};

export async function getWalletTokensMultichain(
  address: string,
  testnet: boolean,
): Promise<MoralisTokenWithChain[]> {
  const chains = testnet ? [...TESTNET_CHAINS] : [...MAINNET_CHAINS];
  const batches = await Promise.all(
    chains.map((chain) =>
      getWalletTokensForChain(address, chain).catch(() => [] as MoralisTokenBalance[]),
    ),
  );
  return batches.flatMap((tokens, i) =>
    tokens.map((token) => ({ chain: chains[i], token })),
  );
}

export function moralisChainLabel(chainId: string): string {
  return CHAIN_DISPLAY[chainId] ?? chainId;
}

export function moralisTokenToAsset(
  chainId: string,
  t: MoralisTokenBalance,
): PortfolioAsset | null {
  const symbol = t.symbol?.trim() || "TOKEN";
  const isSpam = Boolean(t.possible_spam);
  const valueUsd = capUsd(t.usd_value ?? 0);
  const qty = t.balance_formatted
    ? parseFloat(t.balance_formatted)
    : t.balance && t.decimals != null
      ? Number(t.balance) / 10 ** Math.min(t.decimals, 18)
      : null;

  const hasQty = qty != null && Number.isFinite(qty) && qty > 0;
  if (!isSpam && valueUsd < 0.0005 && !hasQty) return null;

  const logo = t.logo ?? t.thumbnail ?? undefined;
  const isNative = Boolean(t.native_token);

  return {
    id: `moralis-${chainId}-${t.token_address ?? symbol}`,
    symbol,
    name: t.name ?? symbol,
    chain: moralisChainLabel(chainId),
    chainId,
    valueUsd,
    balance:
      hasQty && qty != null
        ? formatQuantityDisplay(qty, symbol)
        : undefined,
    priceUsd: t.usd_price ?? undefined,
    change24hPct: t.usd_price_24hr_percent_change ?? 0,
    logoUrl: resolveTokenLogo(symbol, logo, isNative),
    isSpam,
    isNft: false,
    unverified: !t.verified_contract && valueUsd <= 0 && hasQty,
    positionType: "wallet",
  };
}
