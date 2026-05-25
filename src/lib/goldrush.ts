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
  contract_address?: string;
  contract_decimals?: number;
  balance?: string;
  quote?: number;
  quote_24h?: number;
  is_spam?: boolean;
  logo_url?: string;
  logo_urls?: {
    token_logo_url?: string;
    protocol_logo_url?: string;
    chain_logo_url?: string;
  };
  type?: string;
  native_token?: boolean;
  is_native_token?: boolean;
  supports_erc?: string[];
  nft_data?: Array<{ external_data?: { image?: string; name?: string } }>;
}

export function goldRushTokenLogo(t: GoldRushTokenBalance): string | undefined {
  return (
    t.logo_urls?.token_logo_url ??
    t.logo_urls?.protocol_logo_url ??
    t.logo_url ??
    undefined
  );
}

export function goldRushRawBalance(t: GoldRushTokenBalance): string | undefined {
  if (t.balance == null) return undefined;
  return typeof t.balance === "number" ? String(t.balance) : t.balance;
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
  options?: { includeSpam?: boolean },
): Promise<GoldRushTokenBalance[]> {
  const encoded = encodeURIComponent(address);
  const spamParam = options?.includeSpam ? "" : "&no-spam=true";
  const data = await goldrushFetch<{
    data?: { items?: GoldRushTokenBalance[] };
  }>(
    `/${chainName}/address/${encoded}/balances_v2/?quote-currency=USD${spamParam}`,
  );

  return (data.data?.items ?? []).map((i) => ({
    ...i,
    chain_name: chainName,
    chain_display_name: i.chain_display_name ?? chainName,
  }));
}

const MAINNET_CHAINS = [
  "base-mainnet",
  "eth-mainnet",
  "arbitrum-mainnet",
  "optimism-mainnet",
  "polygon-mainnet",
];

function isGoldRushNftItem(item: GoldRushTokenBalance): boolean {
  return (
    item.type === "nft" ||
    Boolean(item.nft_data?.length) ||
    (item.supports_erc as string[] | undefined)?.includes("ERC721") === true
  );
}

/** Full mainnet scan: fungible balances, API spam flags, and NFT holdings. */
export async function getMainnetBalancesFull(address: string): Promise<{
  clean: GoldRushTokenBalance[];
  spam: GoldRushTokenBalance[];
  nfts: GoldRushTokenBalance[];
}> {
  const results = await Promise.all(
    MAINNET_CHAINS.map(async (chain) => {
      const [allItems, cleanItems] = await Promise.all([
        getChainBalancesV2(chain, address, { includeSpam: true }).catch(
          () => [] as GoldRushTokenBalance[],
        ),
        getChainBalancesV2(chain, address, { includeSpam: false }).catch(
          () => [] as GoldRushTokenBalance[],
        ),
      ]);
      const spam = allItems.filter((i) => i.is_spam && !isGoldRushNftItem(i));
      const nfts = allItems.filter(isGoldRushNftItem);
      return { clean: cleanItems.filter((i) => !isGoldRushNftItem(i)), spam, nfts };
    }),
  );
  return {
    clean: results.flatMap((r) => r.clean),
    spam: results.flatMap((r) => r.spam),
    nfts: results.flatMap((r) => r.nfts),
  };
}

export type GoldRushBalancesBundle = {
  data: { items: GoldRushTokenBalance[] };
  nfts: GoldRushTokenBalance[];
};

/** Balances scoped to testnet OR mainnet — never both at once. */
export async function getBalancesForNetworkMode(
  address: string,
  testnet: boolean,
): Promise<GoldRushBalancesBundle> {
  if (testnet) {
    const chains = ["eth-sepolia", "base-sepolia"];
    const perChain = await Promise.all(
      chains.map((c) =>
        getChainBalancesV2(c, address, { includeSpam: true }).catch(() => []),
      ),
    );
    return { data: { items: perChain.flat() }, nfts: [] as GoldRushTokenBalance[] };
  }
  const { clean, spam, nfts } = await getMainnetBalancesFull(address);
  return { data: { items: [...clean, ...spam] }, nfts };
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
