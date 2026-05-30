import { createHash } from "crypto";
import type { PortfolioAsset } from "@/lib/portfolio-wallet-types";
import { canonicalChainKey } from "@/lib/portfolio-engine";
import { VERIFIED_TOKEN_SYMBOLS } from "@/lib/token-visuals";

const GOPLUS_BASE = "https://api.gopluslabs.io";

/** GoPlus chain id by canonical chain key */
const CHAIN_TO_GOPLUS_ID: Record<string, string> = {
  ethereum: "1",
  "ethereum-sepolia": "11155111",
  base: "8453",
  "base-sepolia": "84532",
  arbitrum: "42161",
  optimism: "10",
  polygon: "137",
  bsc: "56",
  avalanche: "43114",
  linea: "59144",
  scroll: "534352",
};

type GoPlusTokenRow = {
  is_honeypot?: string;
  is_airdrop_scam?: string;
  is_blacklisted?: string;
  cannot_sell_all?: string;
  is_open_source?: string;
  fake_token?: string;
};

type GoPlusTokenResponse = {
  code?: number;
  result?: Record<string, GoPlusTokenRow>;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isGoPlusConfigured(): boolean {
  return Boolean(
    process.env.GOPLUS_API_KEY?.trim() && process.env.GOPLUS_API_SECRET?.trim(),
  );
}

function goPlusCredentials() {
  const appKey = process.env.GOPLUS_API_KEY?.trim();
  const appSecret = process.env.GOPLUS_API_SECRET?.trim();
  if (!appKey || !appSecret) {
    throw new Error("GOPLUS_API_KEY and GOPLUS_API_SECRET are required");
  }
  return { appKey, appSecret };
}

async function getGoPlusAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { appKey, appSecret } = goPlusCredentials();
  const time = Math.floor(Date.now() / 1000);
  const sign = createHash("sha1")
    .update(`${appKey}${time}${appSecret}`)
    .digest("hex");

  const res = await fetch(`${GOPLUS_BASE}/api/v1/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ app_key: appKey, time, sign }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    code?: number;
    result?: { access_token?: string; expires_in?: number };
  };

  const token = json.result?.access_token;
  if (!token) return null;

  cachedToken = {
    value: token,
    expiresAt: Date.now() + (json.result?.expires_in ?? 3600) * 1000,
  };
  return token;
}

function isRiskFlag(value?: string): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

function tokenRowIsSpam(row: GoPlusTokenRow): boolean {
  return (
    isRiskFlag(row.is_honeypot) ||
    isRiskFlag(row.is_airdrop_scam) ||
    isRiskFlag(row.is_blacklisted) ||
    isRiskFlag(row.cannot_sell_all) ||
    isRiskFlag(row.fake_token)
  );
}

async function fetchTokenSecurityBatch(
  chainId: string,
  addresses: string[],
  token: string,
): Promise<Record<string, GoPlusTokenRow>> {
  if (addresses.length === 0) return {};

  const params = new URLSearchParams({
    contract_addresses: addresses.slice(0, 20).join(","),
  });

  const res = await fetch(
    `${GOPLUS_BASE}/api/v1/token_security/${chainId}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) return {};

  const json = (await res.json()) as GoPlusTokenResponse;
  return json.result ?? {};
}

export async function enrichAssetsWithGoPlus(
  assets: PortfolioAsset[],
  contractByAssetId: Map<string, string | undefined>,
): Promise<{ assets: PortfolioAsset[]; flagged: number }> {
  if (!isGoPlusConfigured()) return { assets, flagged: 0 };

  const token = await getGoPlusAccessToken();
  if (!token) return { assets, flagged: 0 };

  const byChain = new Map<string, PortfolioAsset[]>();
  for (const asset of assets) {
    if (VERIFIED_TOKEN_SYMBOLS.has(asset.symbol.toUpperCase())) continue;
    const chainKey = canonicalChainKey(asset.chainId ?? asset.chain);
    const goPlusChain = CHAIN_TO_GOPLUS_ID[chainKey];
    if (!goPlusChain) continue;
    const contract = contractByAssetId.get(asset.id);
    if (!contract?.startsWith("0x")) continue;
    const list = byChain.get(goPlusChain) ?? [];
    list.push(asset);
    byChain.set(goPlusChain, list);
  }

  const spamIds = new Set<string>();
  for (const [chainId, chainAssets] of byChain) {
    const contracts = [
      ...new Set(
        chainAssets
          .map((a) => contractByAssetId.get(a.id))
          .filter((c): c is string => Boolean(c?.startsWith("0x"))),
      ),
    ];

    for (let i = 0; i < contracts.length; i += 20) {
      const batch = contracts.slice(i, i + 20);
      const rows = await fetchTokenSecurityBatch(chainId, batch, token);
      for (const [addr, row] of Object.entries(rows)) {
        if (!tokenRowIsSpam(row)) continue;
        const match = chainAssets.find(
          (a) =>
            contractByAssetId.get(a.id)?.toLowerCase() === addr.toLowerCase(),
        );
        if (match) spamIds.add(match.id);
      }
    }
  }

  if (spamIds.size === 0) return { assets, flagged: 0 };

  return {
    flagged: spamIds.size,
    assets: assets.map((a) =>
      spamIds.has(a.id) ? { ...a, isSpam: true } : a,
    ),
  };
}
