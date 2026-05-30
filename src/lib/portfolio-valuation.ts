/** Per-asset and portfolio USD sanity limits */
export const MAX_ASSET_USD = 50_000_000;

const STABLE_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USDBC", "EURC"]);

export function capUsd(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, MAX_ASSET_USD);
}

/**
 * Prefer the sum of displayed token rows. Zerion totals often include hidden spam
 * or mispriced positions that inflate net worth vs the asset table.
 */
export function resolvePortfolioTotalUsd(
  assetSum: number,
  zerionTotal?: number,
): number {
  const sum = capUsd(assetSum);
  if (typeof zerionTotal !== "number" || zerionTotal <= 0) return sum;
  const z = capUsd(zerionTotal);
  if (sum <= 0) return z;

  const ratio = z / sum;
  if (ratio > 2.5 || ratio < 0.4) return sum;
  return sum;
}

export function resolveChainDistributionFromAssets(
  assets: Array<{ chainId?: string; chain: string; valueUsd: number }>,
): Record<string, number> {
  const chainDistribution: Record<string, number> = {};
  for (const a of assets) {
    const key = (a.chainId ?? a.chain).toLowerCase().replace(/\s+/g, "-");
    chainDistribution[key] = (chainDistribution[key] ?? 0) + capUsd(a.valueUsd);
  }
  return chainDistribution;
}

/** Guard stablecoins and absurd quotes from bad decimals or spam pricing. */
export function sanitizeAssetUsd(
  symbol: string,
  valueUsd: number,
  balance?: string,
  priceUsd?: number,
): number {
  let v = capUsd(valueUsd);
  const sym = symbol.toUpperCase();

  if (STABLE_SYMBOLS.has(sym) && v > 1_000_000) {
    const bal = parseBalanceFloat(balance);
    if (bal != null && bal > 0 && bal < 10_000_000) {
      v = capUsd(bal);
    }
  }

  if (priceUsd != null && priceUsd > 0 && v > MAX_ASSET_USD / 10) {
    const bal = parseBalanceFloat(balance);
    if (bal != null && bal > 0) {
      const implied = capUsd(bal * priceUsd);
      if (implied > 0 && implied < v * 0.5) v = implied;
    }
  }

  return v;
}

function parseBalanceFloat(balance?: string): number | null {
  if (!balance || balance === "0" || balance === "<0.0001") return null;
  const n = parseFloat(balance.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
