import { NextRequest, NextResponse } from "next/server";
import { fetchLifiQuote } from "@/lib/lifi";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const fromChain = p.get("fromChain");
  const toChain = p.get("toChain");
  const fromToken = p.get("fromToken");
  const toToken = p.get("toToken");
  const fromAmount = p.get("fromAmount");
  const fromAddress = p.get("fromAddress");
  const toAddress = p.get("toAddress") ?? fromAddress;

  if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !fromAddress) {
    return NextResponse.json({ error: "Missing quote parameters" }, { status: 400 });
  }

  try {
    const quote = await fetchLifiQuote({
      fromChain: Number(fromChain),
      toChain: Number(toChain),
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      toAddress: toAddress ?? undefined,
    });
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LiFi quote failed" },
      { status: 502 },
    );
  }
}
