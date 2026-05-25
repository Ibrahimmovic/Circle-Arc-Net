import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/coingecko";
import { detectRegime } from "@/lib/portfolio-engine";

export async function GET() {
  try {
    const markets = await getMarketSnapshot();
    const blendedChange = (markets.ethChange24h + markets.btcChange24h) / 2;
    const { regime, score } = detectRegime(blendedChange);

    return NextResponse.json({
      markets,
      macroRegime: regime,
      macroScore: score,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Markets unavailable" },
      { status: 500 },
    );
  }
}
