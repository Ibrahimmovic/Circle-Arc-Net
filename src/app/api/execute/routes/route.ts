import { NextRequest, NextResponse } from "next/server";
import {
  findExecToken,
  getExecChain,
} from "@/lib/execution/chain-catalog";
import { fetchCrossChainRoutes } from "@/lib/lifi-routes";
import { toBaseUnits } from "@/lib/execute-tokens";
import { resolveApiTestnet, type NetworkMode } from "@/lib/network";
import { useCircleCctpBridge } from "@/lib/execute-tokens";

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

  const routes = await fetchCrossChainRoutes({
    fromChainId: fromCfg.lifiChainId,
    toChainId: toCfg.lifiChainId,
    fromToken: fromMeta.symbol,
    toToken: toMeta.symbol,
    fromAmount: toBaseUnits(amount, fromMeta.decimals),
    fromAddress,
    toAddress: body.toAddress ?? fromAddress,
  });

  const isUsdcBridge =
    fromChain !== toChain &&
    fromToken === "USDC" &&
    toToken === "USDC" &&
    useCircleCctpBridge(fromChain, toChain, fromMeta, toMeta);

  if (isUsdcBridge) {
    routes.unshift({
      id: "circle-cctp",
      badge: "direct",
      provider: "Circle CCTP",
      title: "Circle Direct",
      executable: true,
      circleDirect: true,
      hint: "Native USDC burn/mint · best for stablecoins",
    });
  }

  return NextResponse.json({
    routes,
    mode,
    fromChain: fromCfg.label,
    toChain: toCfg.label,
  });
}
