import { NextRequest, NextResponse } from "next/server";
import {
  findExecToken,
  getExecChain,
} from "@/lib/execution/chain-catalog";
import { fetchCrossChainRoutes } from "@/lib/lifi-routes";
import { toBaseUnits } from "@/lib/execute-tokens";
import { resolveApiTestnet, type NetworkMode } from "@/lib/network";
import { useCircleCctpBridge } from "@/lib/execute-tokens";
import {
  buildExecutionPipeline,
  classifyExecution,
  intentSentence,
} from "@/lib/execution/execution-intent-ui";
import type { CrossChainIntent } from "@/lib/execution/intent-types";

export async function POST(req: NextRequest) {
  let body: {
    fromChain?: string;
    toChain?: string;
    fromToken?: string;
    toToken?: string;
    amount?: string;
    fromAddress?: string;
    toAddress?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromAddress = body.fromAddress;
  if (!fromAddress) {
    return NextResponse.json({ error: "fromAddress required" }, { status: 400 });
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet = resolveApiTestnet(networkParam);
  const mode: NetworkMode = testnet ? "testnet" : "mainnet";

  const fromChain = body.fromChain ?? "";
  const toChain = body.toChain ?? "";
  const fromToken = body.fromToken ?? "USDC";
  const toToken = body.toToken ?? "USDC";
  const amount = body.amount ?? "0";

  const fromCfg = getExecChain(fromChain, mode);
  const toCfg = getExecChain(toChain, mode);
  const fromMeta = findExecToken(fromChain, fromToken, mode);
  const toMeta = findExecToken(toChain, toToken, mode);

  if (!fromCfg || !toCfg || !fromMeta || !toMeta) {
    return NextResponse.json({ error: "Unsupported chain or token" }, { status: 400 });
  }

  const intent: CrossChainIntent = {
    fromChain,
    toChain,
    fromToken,
    toToken,
    amount,
  };
  const executionKind = classifyExecution(fromChain, toChain, fromToken, toToken);
  const sentence = intentSentence(intent, fromCfg.label, toCfg.label);
  const pipeline = buildExecutionPipeline(
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromCfg.label,
    toCfg.label,
  );

  const orchestrationHint =
    executionKind === "full"
      ? "One signature · debit, route, convert, deliver"
      : executionKind === "transfer"
        ? "Stablecoin migration · burn/mint rail"
        : "Same-chain conversion";

  const routes = await fetchCrossChainRoutes({
    fromChainId: fromCfg.lifiChainId,
    toChainId: toCfg.lifiChainId,
    fromToken: fromMeta.symbol,
    toToken: toMeta.symbol,
    fromAmount: toBaseUnits(amount, fromMeta.decimals),
    fromAddress,
    toAddress: body.toAddress ?? fromAddress,
    executionHint: orchestrationHint,
  });

  const isUsdcBridge =
    executionKind === "transfer" &&
    useCircleCctpBridge(fromChain, toChain, fromMeta, toMeta);

  if (isUsdcBridge) {
    routes.unshift({
      id: "circle-cctp",
      badge: "direct",
      provider: "Circle CCTP",
      title: "Circle Direct",
      executable: true,
      circleDirect: true,
      hint: "Stable transfer only — same token across chains",
      executionHint: "Position migration · no swap leg",
    });
  }

  return NextResponse.json({
    routes,
    mode,
    executionKind,
    intent: sentence,
    pipeline,
    fromChain: fromCfg.label,
    toChain: toCfg.label,
  });
}
