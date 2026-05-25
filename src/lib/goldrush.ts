const GOLDRUSH_BASE = "https://api.covalenthq.com/v1";

function goldrushAuth(): string {
  const key = process.env.GOLDRUSH_API_KEY;
  if (!key) throw new Error("GOLDRUSH_API_KEY is not configured");
  return Buffer.from(`${key}:`).toString("base64");
}

export async function goldrushFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${GOLDRUSH_BASE}${path}`, {
    headers: {
      accept: "application/json",
      authorization: `Basic ${goldrushAuth()}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoldRush API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export interface GoldRushTokenBalance {
  chain_name?: string;
  chain_display_name?: string;
  contract_ticker_symbol?: string;
  contract_name?: string;
  quote?: number;
  quote_24h?: number;
  is_spam?: boolean;
}

export interface GoldRushAllChainsBalance {
  data?: {
    items?: GoldRushTokenBalance[];
  };
}

const TESTNET_CHAIN_PREFIXES = [
  "eth-sepolia",
  "base-sepolia",
  "sepolia",
  "fuji",
  "amoy",
  "testnet",
];

export function isTestnetChainName(chain: string): boolean {
  const c = chain.toLowerCase();
  return TESTNET_CHAIN_PREFIXES.some((p) => c.includes(p));
}

export function aggregateGoldRushByChain(
  items: GoldRushTokenBalance[],
  testnetOnly?: boolean,
): {
  chainDistribution: Record<string, number>;
  totalUsd: number;
  tokens: GoldRushTokenBalance[];
} {
  const chainDistribution: Record<string, number> = {};
  let totalUsd = 0;
  const tokens: GoldRushTokenBalance[] = [];

  for (const item of items) {
    if (item.is_spam) continue;
    const chain = item.chain_name ?? "unknown";
    if (testnetOnly !== undefined) {
      const isTn = isTestnetChainName(chain);
      if (testnetOnly && !isTn) continue;
      if (!testnetOnly && isTn) continue;
    }
    const quote = item.quote ?? 0;
    if (quote <= 0 || quote > 50_000_000) continue;
    chainDistribution[chain] = (chainDistribution[chain] ?? 0) + quote;
    totalUsd += quote;
    tokens.push(item);
  }

  return { chainDistribution, totalUsd, tokens };
}

export async function getAllChainsBalances(
  address: string,
  chains?: string,
) {
  const encoded = encodeURIComponent(address);
  const chainList = chains ?? process.env.GOLDRUSH_CHAINS ?? "eth-mainnet,base-mainnet,arbitrum-mainnet";
  return goldrushFetch<GoldRushAllChainsBalance>(
    `/allchains/address/${encoded}/balances/?chains=${chainList}&quote-currency=USD`,
  );
}

export async function getChainBalancesV2(
  chainName: string,
  address: string,
): Promise<GoldRushTokenBalance[]> {
  const encoded = encodeURIComponent(address);
  const data = await goldrushFetch<{
    data?: { items?: Array<GoldRushTokenBalance & { quote?: number; is_spam?: boolean }> };
  }>(`/${chainName}/address/${encoded}/balances_v2/?quote-currency=USD&no-spam=true`);

  return (data.data?.items ?? []).map((i) => ({
    chain_name: chainName,
    contract_ticker_symbol: i.contract_ticker_symbol,
    contract_name: i.contract_name,
    quote: i.quote,
    is_spam: i.is_spam,
  }));
}

/** Balances scoped to testnet OR mainnet — never both at once. */
export async function getBalancesForNetworkMode(
  address: string,
  testnet: boolean,
) {
  if (testnet) {
    const chains = ["eth-sepolia", "base-sepolia"];
    const perChain = await Promise.all(
      chains.map((c) => getChainBalancesV2(c, address).catch(() => [])),
    );
    return { data: { items: perChain.flat() } };
  }
  return getAllChainsBalances(address);
}

export async function getMultichainBalancesIncludingTestnet(
  address: string,
  extraChains: string[] = ["eth-sepolia", "base-sepolia"],
  mainnetChainList?: string,
) {
  const [allchains, ...perChain] = await Promise.all([
    getAllChainsBalances(address, mainnetChainList).catch(() => ({
      data: { items: [] as GoldRushTokenBalance[] },
    })),
    ...extraChains.map((c) =>
      getChainBalancesV2(c, address).catch(() => [] as GoldRushTokenBalance[]),
    ),
  ]);

  const items = [...(allchains.data?.items ?? []), ...perChain.flat()];
  return { data: { items } };
}
