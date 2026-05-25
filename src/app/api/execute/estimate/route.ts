import { NextRequest, NextResponse } from "next/server";

/** Server-side bridge estimate proxy — full execution uses client App Kit + wallet. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromChain, toChain, amount } = body as {
      fromChain?: string;
      toChain?: string;
      amount?: string;
    };

    if (!fromChain || !toChain || !amount) {
      return NextResponse.json(
        { error: "fromChain, toChain, and amount required" },
        { status: 400 },
      );
    }

    const amt = parseFloat(amount);
    const feeUsd = Math.max(0.01, amt * 0.0008);
    const fast = fromChain !== toChain;

    return NextResponse.json({
      fromChain,
      toChain,
      amount,
      estimatedFeeUsd: feeUsd,
      estimatedMinutes: fast ? 2 : 15,
      protocol: "Circle CCTP v2",
      settlement: "USDC-native on Arc (~$0.01/tx)",
      supported: true,
      note: "Connect wallet on Execute page for live Circle App Kit estimates.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Estimate failed" },
      { status: 500 },
    );
  }
}
