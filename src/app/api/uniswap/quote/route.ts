import { NextRequest, NextResponse } from "next/server";
import { quoteUniswapV3Swap, supportsUniswapV3 } from "@/lib/uniswap-v3";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const chainId = Number(p.get("chainId"));
  const tokenIn = p.get("tokenIn");
  const tokenOut = p.get("tokenOut");
  const amount = p.get("amount");

  if (!chainId || !tokenIn || !tokenOut || !amount) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  if (!supportsUniswapV3(chainId)) {
    return NextResponse.json(
      { error: "Uniswap V3 swaps are only on Base / Arbitrum / OP Sepolia testnets." },
      { status: 400 },
    );
  }

  try {
    const quote = await quoteUniswapV3Swap(chainId, tokenIn, tokenOut, amount);
    return NextResponse.json({
      chainId: quote.chainId,
      symbolIn: quote.symbolIn,
      symbolOut: quote.symbolOut,
      amountIn: quote.amountIn.toString(),
      amountOut: quote.amountOut.toString(),
      amountOutMin: quote.amountOutMin.toString(),
      feeTier: quote.feeTier,
      tokenIn: quote.tokenIn,
      tokenOut: quote.tokenOut,
      swapRouter: quote.swapRouter,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Uniswap quote failed" },
      { status: 502 },
    );
  }
}
