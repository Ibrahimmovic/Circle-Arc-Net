import { NextRequest, NextResponse } from "next/server";
import {
  findExecToken,
  getExecChain,
} from "@/lib/execution/chain-catalog";
import { fetchCrossChainRoutes, type CrossChainRouteOption } from "@/lib/lifi-routes";
import { fetchLifiQuote } from "@/lib/lifi";
import { toBaseUnits, useCircleCctpBridge } from "@/lib/execute-tokens";
import { resolveApiTestnet, type NetworkMode } from "@/lib/network";
import {
  buildExecutionPipeline,
  classifyExecution,
  intentSentence,
} from "@/lib/execution/execution-intent-ui";
import type { CrossChainIntent } from "@/lib/execution/intent-types";
import { isQuoteSane } from "@/lib/format-route-amount";

function circleRoute(
  amount: string,
  executionHint: string,
): CrossChainRouteOption {
  return {
    id: "circle-cctp",
    badge: "direct",
    provider: "Circle CCTP",
    title: "Circle Direct",
    executable: true,
    circleDirect: true,
    toAmountDisplay: `${amount} USDC`,
    hint: "Official USDC burn/mint — use this for Arc ↔ L2 testnet moves",
    executionHint,
  };
}

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

  const canCircle =
    executionKind === "transfer" &&
    useCircleCctpBridge(fromChain, toChain, fromMeta, toMeta);

  let routes: CrossChainRouteOption[] = [];

  if (canCircle) {
    routes = [
      circleRoute(
        amount,
        "Burn on source → Circle attestation → mint on destination (~15 min testnet)",
      ),
    ];
  } else if (executionKind === "full" || executionKind === "same_chain") {
    const orchestrationHint =
      executionKind === "full"
        ? "One signature · debit, route, convert, deliver"
        : "Same-chain conversion";

    const lifiRoutes = await fetchCrossChainRoutes({
      fromChainId: fromCfg.lifiChainId,
      toChainId: toCfg.lifiChainId,
      fromToken: fromMeta.symbol,
      toToken: toMeta.symbol,
      fromAmount: toBaseUnits(amount, fromMeta.decimals),
      fromAddress,
      toAddress: body.toAddress ?? fromAddress,
      executionHint: orchestrationHint,
    });

    routes = lifiRoutes.filter((r) => {
      if (!r.toAmount || r.circleDirect) return r.executable;
      return isQuoteSane({
        fromAmountHuman: amount,
        toAmountRaw: r.toAmount,
        fromDecimals: fromMeta.decimals,
        toDecimals: toMeta.decimals,
        fromToken,
        toToken,
      });
    });

    const primary = routes.find((r) => r.executable && !r.lifiQuote);
    if (primary) {
      try {
        const quote = await fetchLifiQuote({
          fromChain: fromCfg.lifiChainId,
          toChain: toCfg.lifiChainId,
          fromToken: fromMeta.symbol,
          toToken: toMeta.symbol,
          fromAmount: toBaseUnits(amount, fromMeta.decimals),
          fromAddress,
          toAddress: body.toAddress ?? fromAddress,
        });
        const toRaw = quote.estimate?.toAmountMin ?? quote.estimate?.toAmount;
        if (
          toRaw &&
          isQuoteSane({
            fromAmountHuman: amount,
            toAmountRaw: toRaw,
            fromDecimals: fromMeta.decimals,
            toDecimals: toMeta.decimals,
            fromToken,
            toToken,
          })
        ) {
          primary.lifiQuote = quote;
          primary.toAmount = toRaw;
          primary.toAmountDecimals = toMeta.decimals;
        } else {
          routes = routes.filter((r) => r.id !== primary.id);
        }
      } catch {
        routes = routes.filter((r) => r.id !== primary.id);
      }
    }

    if (canCircle && routes.length === 0) {
      routes = [circleRoute(amount, "LI.FI unavailable — use Circle for USDC transfer")];
    }
  }

  if (routes.length === 0) {
    routes = [
      {
        id: "none",
        badge: "best",
        provider: "—",
        title: "No path",
        executable: false,
        hint: "Try Circle USDC↔USDC, or USDC→WETH across Base and Ethereum Sepolia",
      },
    ];
  }

  return NextResponse.json({
    routes,
    mode,
    executionKind,
    intent: sentence,
    pipeline,
    fromChain: fromCfg.label,
    toChain: toCfg.label,
    cctpNote:
      canCircle || fromChain === "Arc_Testnet" || toChain === "Arc_Testnet"
        ? "USDC leaves source immediately; destination credit can take ~15 minutes on testnet."
        : undefined,
  });
}
