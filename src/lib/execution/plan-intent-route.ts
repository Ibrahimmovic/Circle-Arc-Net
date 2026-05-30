import { fetchLifiQuote } from "@/lib/lifi";
import { toBaseUnits, useCircleCctpBridge } from "@/lib/execute-tokens";
import {
  findExecToken,
  getExecChain,
} from "@/lib/execution/chain-catalog";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { planRoute } from "@/lib/route-engine";
import { TESTNET_HOME_CHAIN } from "@/lib/network";
import type { CrossChainIntent, IntentRoutePlan, IntentRouteStep } from "@/lib/execution/intent-types";

function findToken(
  chain: string,
  symbol: string,
  testnet: boolean,
): ExecuteToken | undefined {
  return findExecToken(chain, symbol, testnet ? "testnet" : "mainnet");
}

async function probeLifi(
  intent: CrossChainIntent,
  fromAddress: string,
  fromMeta: ExecuteToken,
  testnet: boolean,
): Promise<IntentRoutePlan["lifi"] | null> {
  const mode = testnet ? "testnet" : "mainnet";
  const fromCfg = getExecChain(intent.fromChain, mode);
  const toCfg = getExecChain(intent.toChain, mode);
  if (!fromCfg || !toCfg) return null;

  try {
    const quote = await fetchLifiQuote({
      fromChain: fromCfg.lifiChainId,
      toChain: toCfg.lifiChainId,
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      fromAmount: toBaseUnits(intent.amount, fromMeta.decimals),
      fromAddress,
      toAddress: fromAddress,
    });
    const tx = quote.transactionRequest;
    return {
      fromChainId: fromCfg.lifiChainId,
      toChainId: toCfg.lifiChainId,
      tool: quote.tool,
      toAmountMin: quote.estimate?.toAmountMin ?? quote.estimate?.toAmount,
      hasTransaction: Boolean(tx?.to && tx?.data),
    };
  } catch {
    return null;
  }
}

function arcFeeSteps(testnet: boolean): number {
  return testnet ? 1 : 0;
}

/** Pick the smartest testnet route: prefer one-shot LI.FI when it bundles bridge+swap. */
export async function planCrossChainIntent(
  intent: CrossChainIntent,
  fromAddress: string,
  options: { testnet?: boolean } = {},
): Promise<IntentRoutePlan> {
  const testnet = options.testnet ?? true;
  const sameChain = intent.fromChain === intent.toChain;
  const fromMeta = findToken(intent.fromChain, intent.fromToken, testnet);
  const toMeta = findToken(intent.toChain, intent.toToken, testnet);

  if (!fromMeta || !toMeta) {
    return {
      intent,
      strategy: "unavailable",
      summary: "Token or chain not supported on this network.",
      estimatedWalletSteps: 0,
      steps: [],
      signChain: intent.fromChain,
      fallbackHint: "Pick chains and tokens from the testnet list (Base Sepolia, Ethereum Sepolia, Arc).",
    };
  }

  const legacy = planRoute(intent.fromChain, intent.toChain, fromMeta, toMeta);
  const lifi = await probeLifi(intent, fromAddress, fromMeta, testnet);
  const feeSteps = arcFeeSteps(testnet);

  const isUsdcBridge =
    !sameChain &&
    intent.fromToken === "USDC" &&
    intent.toToken === "USDC" &&
    useCircleCctpBridge(intent.fromChain, intent.toChain, fromMeta, toMeta);

  const isTokenBuy =
    !sameChain &&
    intent.fromToken === "USDC" &&
    intent.toToken !== "USDC";

  const isCrossAsset =
    !sameChain && intent.fromToken !== intent.toToken;

  /** One-shot: LI.FI returns a single tx that can bridge + swap (when liquidity exists). */
  if (lifi?.hasTransaction) {
    const manualSteps = isUsdcBridge
      ? 3
      : isTokenBuy || isCrossAsset
        ? 5
        : sameChain
          ? 2
          : 4;
    const walletSteps = feeSteps + 1;
    const steps: IntentRouteStep[] = [
      ...(testnet
        ? [{ order: 1, label: "Arc platform fee (0.01 USDC)", chain: "Arc Testnet", automated: true }]
        : []),
      {
        order: testnet ? 2 : 1,
        label: `Execute route on ${legacy.signChain.replace(/_/g, " ")} (${lifi.tool ?? "LI.FI"})`,
        chain: legacy.signChain,
        automated: true,
      },
    ];

    let savingsNote: string | undefined;
    if (manualSteps > walletSteps) {
      savingsNote = `~${manualSteps - walletSteps} fewer wallet step(s) vs manual bridge → wait → DEX.`;
    }

    return {
      intent,
      strategy: "lifi_one_shot",
      summary: sameChain
        ? `Swap ${intent.fromToken} → ${intent.toToken} on one chain · ${walletSteps} wallet confirm(s).`
        : `Move ${intent.amount} ${intent.fromToken} (${intent.fromChain.replace(/_/g, " ")}) → ${intent.toToken} (${intent.toChain.replace(/_/g, " ")}) in one routed action.`,
      estimatedWalletSteps: walletSteps,
      steps,
      signChain: legacy.signChain,
      lifi,
      savingsNote,
    };
  }

  if (sameChain) {
    const steps: IntentRouteStep[] = [
      ...(testnet
        ? [{ order: 1, label: "Arc platform fee", chain: TESTNET_HOME_CHAIN, automated: true }]
        : []),
      {
        order: testnet ? 2 : 1,
        label: legacy.label,
        chain: legacy.signChain,
        automated: legacy.kind !== "circle-swap",
      },
    ];
    return {
      intent,
      strategy: "same_chain",
      summary: `${legacy.label} · use Exchange tab if LI.FI has no liquidity.`,
      estimatedWalletSteps: feeSteps + (legacy.kind === "circle-cctp" ? 3 : 2),
      steps,
      signChain: legacy.signChain,
      lifi: lifi ?? undefined,
      fallbackHint: legacy.hint,
    };
  }

  if (isUsdcBridge) {
    const steps: IntentRouteStep[] = [
      { order: 1, label: "Arc platform fee", chain: TESTNET_HOME_CHAIN, automated: true },
      { order: 2, label: "Approve USDC for CCTP", chain: intent.fromChain, automated: false },
      { order: 3, label: "Burn USDC (bridge)", chain: intent.fromChain, automated: false },
      { order: 4, label: "Mint USDC on destination", chain: intent.toChain, automated: false },
    ];
    return {
      intent,
      strategy: "circle_cctp",
      summary: `Bridge USDC via Circle CCTP · lowest protocol path for stablecoins · ${steps.length} logical steps.`,
      estimatedWalletSteps: feeSteps + 3,
      steps,
      signChain: legacy.signChain,
      fallbackHint:
        "Cheapest for USDC-only moves. For buying another token on the destination chain, try LI.FI one-shot when quoted.",
    };
  }

  if (isTokenBuy || isCrossAsset) {
    const steps: IntentRouteStep[] = [
      { order: 1, label: "Arc platform fee", chain: TESTNET_HOME_CHAIN, automated: true },
      { order: 2, label: `Swap ${intent.fromToken} → USDC on source`, chain: intent.fromChain, automated: false },
      { order: 3, label: "Bridge USDC (CCTP)", chain: intent.fromChain, automated: false },
      { order: 4, label: `Swap USDC → ${intent.toToken} on destination`, chain: intent.toChain, automated: false },
    ];
    return {
      intent,
      strategy: "cctp_then_swap",
      summary: `Manual path: ${intent.amount} ${intent.fromToken} → ${intent.toToken} across chains (LI.FI quote unavailable for this pair).`,
      estimatedWalletSteps: feeSteps + 4,
      steps,
      signChain: intent.fromChain,
      lifi: lifi ?? undefined,
      fallbackHint:
        "Fund both chains or try a smaller amount. On mainnet, Solana destinations use the same intent flow via LI.FI when supported.",
    };
  }

  return {
    intent,
    strategy: "unavailable",
    summary: "No automated route found for this pair.",
    estimatedWalletSteps: 0,
    steps: [],
    signChain: intent.fromChain,
    fallbackHint: legacy.hint,
  };
}
