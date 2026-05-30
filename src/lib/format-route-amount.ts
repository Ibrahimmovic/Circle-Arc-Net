import { formatUnits } from "viem";

/** Format LI.FI / route raw amounts with correct decimals. */
export function formatRouteAmount(
  raw: string | undefined,
  decimals: number,
  symbol: string,
): string | null {
  if (!raw || raw === "0") return null;
  try {
    const n = Number(formatUnits(BigInt(raw), decimals));
    if (!Number.isFinite(n) || n <= 0) return null;
    const maxFrac = decimals <= 8 ? 6 : 4;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: maxFrac })} ${symbol}`;
  } catch {
    return null;
  }
}

/** Reject bogus aggregator quotes (common on Arc testnet pairs). */
export function isQuoteSane(params: {
  fromAmountHuman: string;
  toAmountRaw: string;
  fromDecimals: number;
  toDecimals: number;
  fromToken: string;
  toToken: string;
}): boolean {
  const from = Number(params.fromAmountHuman);
  if (!Number.isFinite(from) || from <= 0) return false;
  try {
    const to = Number(
      formatUnits(BigInt(params.toAmountRaw), params.toDecimals),
    );
    if (!Number.isFinite(to) || to <= 0) return false;
    const same =
      params.fromToken.toUpperCase() === params.toToken.toUpperCase();
    if (same) {
      const ratio = to / from;
      return ratio > 0.9 && ratio < 1.1;
    }
    return true;
  } catch {
    return false;
  }
}
