import { NextRequest, NextResponse } from "next/server";
import { getEthSparkline, syntheticSparkline } from "@/lib/coingecko";
import { buildPortfolioWalletFeed } from "@/lib/portfolio-wallet";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet =
    networkParam === "mainnet"
      ? false
      : networkParam === "testnet" ||
        process.env.NEXT_PUBLIC_NETWORK !== "mainnet";

  try {
    const [{ feed, analysis }, sparkline] = await Promise.all([
      buildPortfolioWalletFeed(address, testnet),
      getEthSparkline()
        .catch(() => syntheticSparkline(0)),
    ]);
    return NextResponse.json({
      ...feed,
      analysis,
      sparkline,
      hint:
        feed.totalUsd === 0
          ? testnet
            ? "No testnet balance — Fund on Execute, then refresh."
            : "No mainnet balance for this wallet."
          : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Portfolio load failed",
      },
      { status: 502 },
    );
  }
}
