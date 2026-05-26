const ZERION_BASE = "https://api.zerion.io/v1";

export function isZerionConfigured(): boolean {
  return Boolean(process.env.ZERION_API_KEY?.trim());
}

function zerionAuth(): string {
  const raw = process.env.ZERION_API_KEY;
  if (!raw) throw new Error("ZERION_API_KEY is not configured");
  const key = raw.trim().replace(/^Zk_/i, "zk_");
  return Buffer.from(`${key}:`).toString("base64");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

  let lastError = "Zerion request failed";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(800 * attempt);

    const res = await fetch(`${ZERION_BASE}${path}`, {
      headers,
      cache: "no-store",
    });

    if (res.ok) return res.json() as Promise<T>;

    const text = await res.text();
    lastError = `Zerion API ${res.status}: ${text.slice(0, 200)}`;
    if (res.status !== 429) break;
  }

  throw new Error(lastError);
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
    quantity?: { float?: number; numeric?: string };
    percent_change_24h?: number;
    position_type?: string;
    protocol?: string;
    fungible_info?: {
      symbol?: string;
      name?: string;
      icon?: { url?: string };
    };
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
  const all: ZerionPosition[] = [];
  let path: string | null =
    `/wallets/${encoded}/positions/?currency=usd&sort=-value&filter[positions]=no_filter&filter[trash]=${trash}&page[size]=100`;

  while (path) {
    const res: ZerionPositionsResponse = await zerionFetch<ZerionPositionsResponse>(
      path,
      { testnet },
    );
    if (res.data?.length) all.push(...res.data);
    const next = res.links?.next;
    if (!next) break;
    path = next.startsWith("http")
      ? new URL(next).pathname.replace(/^\/v1/, "") + new URL(next).search
      : next;
  }

  return { data: all, links: undefined };
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
      fungible_info?: {
      symbol?: string;
      name?: string;
      icon?: { url?: string };
    };
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
    `/wallets/${encoded}/transactions/?currency=usd&page[size]=80&filter[trash]=${trash}`,
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
  const all: ZerionNftPosition[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 4; page++) {
    const after = cursor ? `&page[after]=${encodeURIComponent(cursor)}` : "";
    const res = await zerionFetch<ZerionNftPositionsResponse & {
      links?: { next?: string | null };
    }>(
      `/wallets/${encoded}/nft-positions/?currency=usd&sort=-floor_price&page[size]=100${after}`,
      { testnet },
    );
    if (res.data?.length) all.push(...res.data);
    const next = res.links?.next;
    if (!next) break;
    try {
      const u = new URL(next);
      cursor = u.searchParams.get("page[after]") ?? undefined;
      if (!cursor) break;
    } catch {
      break;
    }
  }
  return { data: all };
}
