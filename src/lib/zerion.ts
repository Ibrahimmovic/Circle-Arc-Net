const ZERION_BASE = "https://api.zerion.io/v1";

function zerionAuth(): string {
  const key = process.env.ZERION_API_KEY;
  if (!key) throw new Error("ZERION_API_KEY is not configured");
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
    next: { revalidate: 60 },
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
) {
  const encoded = encodeURIComponent(address);
  return zerionFetch<ZerionPositionsResponse>(
    `/wallets/${encoded}/positions/?currency=usd&sort=-value&filter[positions]=only_simple&filter[trash]=only_non_trash&page[size]=50`,
    { testnet },
  );
}
