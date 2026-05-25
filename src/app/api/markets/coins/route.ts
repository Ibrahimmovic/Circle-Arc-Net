import { NextResponse } from "next/server";
import { getTopCoins } from "@/lib/coingecko";

export async function GET() {
  try {
    const coins = await getTopCoins(14);
    return NextResponse.json({ coins });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed", coins: [] },
      { status: 500 },
    );
  }
}
