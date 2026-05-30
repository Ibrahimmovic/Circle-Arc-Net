import { NextRequest, NextResponse } from "next/server";
import { fetchPortfolioChart } from "@/lib/portfolio-chart";
import { resolveApiTestnet } from "@/lib/network";
import { buildPortfolioWalletFeed } from "@/lib/portfolio-wallet";
import type { ZerionChartPeriod } from "@/lib/zerion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHART_PERIODS = new Set<ZerionChartPeriod>([
  "hour",
  "day",
  "week",
  "month",
  "3months",
  "6months",
  "year",
  "5years",
  "max",
]);

function portfolioJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return portfolioJson({ error: "Invalid address" }, 400);
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet = resolveApiTestnet(networkParam);
  const periodParam = req.nextUrl.searchParams.get("chartPeriod") ?? "week";
  const chartPeriod = CHART_PERIODS.has(periodParam as ZerionChartPeriod)
    ? (periodParam as ZerionChartPeriod)
    : "week";

  try {
    const { feed, analysis } = await buildPortfolioWalletFeed(address, testnet);
    const portfolioChart = await fetchPortfolioChart(
      address,
      testnet,
      chartPeriod,
      feed.totalUsd,
      feed.change24hPct,
    );
    const sparkline = portfolioChart.values;
    return portfolioJson({
      ...feed,
      analysis,
      portfolioChart,
      sparkline,
      hint:
        feed.totalUsd === 0
          ? testnet
            ? "No testnet balance — Fund on Execute, then refresh."
            : "No mainnet balance for this wallet."
          : undefined,
    });
  } catch (e) {
    return portfolioJson(
      {
        error: e instanceof Error ? e.message : "Portfolio load failed",
      },
      502,
    );
  }
}
