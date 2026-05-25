const CIRCLE_BASE = "https://api.circle.com";

export function getCircleAuthHeader(): string {
  const key = process.env.CIRCLE_API_KEY;
  if (!key) throw new Error("CIRCLE_API_KEY is not configured");
  return `Bearer ${key}`;
}

export async function circleFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${CIRCLE_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: getCircleAuthHeader(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Circle API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export interface CircleWalletsResponse {
  data?: {
    wallets?: Array<{
      id: string;
      state: string;
      walletSetId?: string;
      custodyType?: string;
      address?: string;
      blockchain?: string;
    }>;
  };
}

export async function listCircleWallets(): Promise<CircleWalletsResponse> {
  return circleFetch<CircleWalletsResponse>("/v1/w3s/wallets");
}

export function getKitKey(): string | undefined {
  return (
    process.env.CIRCLE_KIT_KEY ??
    process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY
  );
}

export type CircleFaucetBlockchain =
  | "ETH-SEPOLIA"
  | "BASE-SEPOLIA"
  | "ARB-SEPOLIA"
  | "ARC-TESTNET"
  | "OP-SEPOLIA"
  | "MATIC-AMOY";

export async function requestCircleFaucet(params: {
  address: string;
  blockchain: CircleFaucetBlockchain;
  usdc?: boolean;
  native?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${CIRCLE_BASE}/v1/faucet/drips`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: getCircleAuthHeader(),
    },
    body: JSON.stringify({
      address: params.address,
      blockchain: params.blockchain,
      usdc: params.usdc ?? true,
      native: params.native ?? true,
    }),
  });

  if (res.status === 204) {
    return { ok: true, message: "Testnet tokens requested — arrive in ~30s." };
  }

  const text = await res.text();
  let message = text.slice(0, 400);
  try {
    const json = JSON.parse(text) as { message?: string };
    message = json.message ?? message;
  } catch {
    /* keep raw */
  }

  return { ok: false, message };
}
