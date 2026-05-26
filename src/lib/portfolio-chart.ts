import {
  getWalletBalanceChart,
  isZerionConfigured,
  type ZerionChartPeriod,
} from "@/lib/zerion";

export type PortfolioChartPoint = { t: number; v: number };

export type PortfolioChart = {
  period: ZerionChartPeriod;
  points: PortfolioChartPoint[];
  values: number[];
  beginAt?: string;
  endAt?: string;
  pnlUsd: number;
  pnlPct: number;
  source: "zerion" | "estimated";
};

export function parseZerionChartPoints(
  raw: Array<[number, number]> | undefined,
): PortfolioChartPoint[] {
  if (!raw?.length) return [];
  return raw
    .map(([t, v]) => ({ t: Number(t), v: Number(v) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v));
}

export function chartPnl(points: PortfolioChartPoint[]): {
  pnlUsd: number;
  pnlPct: number;
} {
  if (points.length < 2) return { pnlUsd: 0, pnlPct: 0 };
  const first = points[0].v;
  const last = points[points.length - 1].v;
  const pnlUsd = last - first;
  const pnlPct = first > 0 ? (pnlUsd / first) * 100 : 0;
  return { pnlUsd, pnlPct };
}

/** Flat line from current net worth when Zerion chart is unavailable. */
export function estimatedPortfolioChart(
  totalUsd: number,
  change24hPct: number,
  period: ZerionChartPeriod = "week",
): PortfolioChart {
  const now = Math.floor(Date.now() / 1000);
  const days =
    period === "day"
      ? 1
      : period === "week"
        ? 7
        : period === "month"
          ? 30
          : 90;
  const start = now - days * 86400;
  const prev =
    change24hPct !== 0 && Number.isFinite(change24hPct)
      ? totalUsd / (1 + change24hPct / 100)
      : totalUsd;
  const points: PortfolioChartPoint[] = [
    { t: start, v: Math.max(prev, 0) },
    { t: now, v: Math.max(totalUsd, 0) },
  ];
  const { pnlUsd, pnlPct } = chartPnl(points);
  return {
    period,
    points,
    values: points.map((p) => p.v),
    pnlUsd,
    pnlPct,
    source: "estimated",
  };
}

export async function fetchPortfolioChart(
  address: string,
  testnet: boolean,
  period: ZerionChartPeriod,
  totalUsd: number,
  change24hPct: number,
): Promise<PortfolioChart> {
  if (!isZerionConfigured()) {
    return estimatedPortfolioChart(totalUsd, change24hPct, period);
  }

  try {
    const res = await getWalletBalanceChart(address, period, testnet);
    const attrs = res.data?.attributes;
    const points = parseZerionChartPoints(attrs?.points as Array<[number, number]>);
    if (points.length < 2) {
      return estimatedPortfolioChart(totalUsd, change24hPct, period);
    }
    const { pnlUsd, pnlPct } = chartPnl(points);
    return {
      period,
      points,
      values: points.map((p) => p.v),
      beginAt: attrs?.begin_at,
      endAt: attrs?.end_at,
      pnlUsd,
      pnlPct,
      source: "zerion",
    };
  } catch {
    return estimatedPortfolioChart(totalUsd, change24hPct, period);
  }
}
