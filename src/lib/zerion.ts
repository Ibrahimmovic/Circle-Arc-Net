const ZERION_BASE = "https://api.zerion.io/v1";

function zerionAuth(): string {
  const raw = process.env.ZERION_API_KEY;
  if (!raw) throw new Error("ZERION_API_KEY is not configured");
  const key = raw.trim().replace(/^Zk_/i, "zk_");
  return Buffer.from(`${key}:`).toString("base64");
}

export async function zerionFetch<T>(
  path: string,
  options?: { testnet?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Basic ${zerionAuth()}`,
  };
  if (options?.testnet) headers["X-Env"] = "testnet";

  const res = await fetch(`${ZERION_BASE}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zerion API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export interface ZerionPortfolioResponse {
  data?: {
    attributes?: {
      total?: { positions?: number };
      changes?: { percent_1d?: number; absolute_1d?: number };
      positions_distribution_by_chain?: Record<string, number>;
      positions_distribution_by_type?: Record<string, number>;
    };
  };
}

export interface ZerionPosition {
  id: string;
  attributes?: {
    name?: string;
    symbol?: string;
    value?: number;
    price?: number;
    quantity?: { float?: number };
    percent_change_24h?: number;
    fungible_info?: { symbol?: string; name?: string };
  };
  relationships?: {
    chain?: { data?: { id?: string } };
    fungible?: { data?: { id?: string } };
  };
}

export interface ZerionPositionsResponse {
  data?: ZerionPosition[];
  links?: { next?: string };
}

export async function getWalletPortfolio(
  address: string,
  testnet = false,
) {
  const encoded = encodeURIComponent(address);
  return zerionFetch<ZerionPortfolioResponse>(
    `/wallets/${encoded}/portfolio?currency=usd`,
    { testnet },
  );
}

export async function getWalletPositions(
  address: string,
  testnet = false,
  trash: "only_non_trash" | "only_trash" | "no_filter" = "only_non_trash",
) {
  const encoded = encodeURIComponent(address);
  return zerionFetch<ZerionPositionsResponse>(
    `/wallets/${encoded}/positions/?currency=usd&sort=-value&filter[positions]=no_filter&filter[trash]=${trash}&page[size]=80`,
    { testnet },
  );
}

export interface ZerionTransaction {
  id: string;
  attributes?: {
    operation_type?: string;
    hash?: string;
    mined_at?: string;
    is_trash?: boolean;
    fee?: { value?: number };
    application_metadata?: { name?: string };
    transfers?: Array<{
      direction?: string;
      quantity?: { float?: number };
      value?: number;
      fungible_info?: { symbol?: string; name?: string };
    }>;
  };
  relationships?: {
    chain?: { data?: { id?: string } };
  };
}

export interface ZerionTransactionsResponse {
  data?: ZerionTransaction[];
}

export async function getWalletTransactions(
  address: string,
  testnet = false,
  trash: "only_non_trash" | "only_trash" | "no_filter" = "no_filter",
) {
  const encoded = encodeURIComponent(address);
  return zerionFetch<ZerionTransactionsResponse>(
    `/wallets/${encoded}/transactions/?currency=usd&page[size]=40&filter[trash]=${trash}`,
    { testnet },
  );
}

export interface ZerionNftPosition {
  id: string;
  attributes?: {
    name?: string;
    amount?: number;
    floor_price?: number;
    changed_at?: string;
    flags?: { is_spam?: boolean };
    collection_info?: { name?: string };
    preview?: { url?: string };
  };
  relationships?: {
    chain?: { data?: { id?: string } };
  };
}

export interface ZerionNftPositionsResponse {
  data?: ZerionNftPosition[];
}

export async function getWalletNftPositions(address: string, testnet = false) {
  const encoded = encodeURIComponent(address);
  return zerionFetch<ZerionNftPositionsResponse>(
    `/wallets/${encoded}/nft-positions/?currency=usd&sort=-floor_price&page[size]=40`,
    { testnet },
  );
}
