/** Display thresholds — hide dust like DeBank/Zerion default views */
export const MIN_POSITION_USD = 0.25;
export const MIN_CHAIN_USD = 1;
export const MIN_CHAIN_PERCENT = 0.5;
export const MAX_CHAIN_CARDS = 10;
export const MAX_TOKEN_ROWS = 80;

export function formatQuantityDisplay(qty: number, _symbol?: string): string {
  if (!Number.isFinite(qty) || qty === 0) return "0";
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(2)}M`;
  if (qty >= 1) return qty.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (qty >= 0.0001) return qty.toFixed(6).replace(/\.?0+$/, "");
  return "<0.0001";
}

export function parseBalanceString(bal: string | undefined): number | null {
  if (!bal || bal === "0" || bal === "<0.0001") return null;
  const n = parseFloat(bal.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function weightedChange24(
  holdings: Array<{ valueUsd: number; change24hPct: number }>,
): number {
  let total = 0;
  let weighted = 0;
  for (const h of holdings) {
    if (h.valueUsd <= 0) continue;
    total += h.valueUsd;
    weighted += h.change24hPct * h.valueUsd;
  }
  return total > 0 ? weighted / total : 0;
}
