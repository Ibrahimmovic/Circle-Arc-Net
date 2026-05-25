import { NextResponse } from "next/server";
import { getEthSparkline, syntheticSparkline } from "@/lib/coingecko";
import { getMarketSnapshot } from "@/lib/coingecko";

export async function GET() {
  try {
    const [sparkline, markets] = await Promise.all([
      getEthSparkline().catch(() => null),
      getMarketSnapshot().catch(() => null),
    ]);
    const trend =
      ((markets?.ethChange24h ?? 0) + (markets?.btcChange24h ?? 0)) / 200;
    return NextResponse.json({
      sparkline: sparkline ?? syntheticSparkline(trend),
      ethChange24h: markets?.ethChange24h ?? 0,
    });
  } catch {
    return NextResponse.json({ sparkline: syntheticSparkline(0), ethChange24h: 0 });
  }
}
