import { NextRequest, NextResponse } from "next/server";
import { planCrossChainIntent } from "@/lib/execution/plan-intent-route";
import type { CrossChainIntent } from "@/lib/execution/intent-types";
import { resolveApiTestnet } from "@/lib/network";

export async function POST(req: NextRequest) {
  let body: Partial<CrossChainIntent> & { fromAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fromAddress = body.fromAddress ?? req.nextUrl.searchParams.get("fromAddress");
  if (!fromAddress) {
    return NextResponse.json({ error: "fromAddress required" }, { status: 400 });
  }

  const intent: CrossChainIntent = {
    fromChain: body.fromChain ?? "",
    toChain: body.toChain ?? "",
    fromToken: body.fromToken ?? "USDC",
    toToken: body.toToken ?? "WETH",
    amount: body.amount ?? "10",
  };

  if (!intent.fromChain || !intent.toChain) {
    return NextResponse.json({ error: "fromChain and toChain required" }, { status: 400 });
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet = resolveApiTestnet(networkParam);

  try {
    const plan = await planCrossChainIntent(intent, fromAddress, { testnet });
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Intent planning failed" },
      { status: 502 },
    );
  }
}
