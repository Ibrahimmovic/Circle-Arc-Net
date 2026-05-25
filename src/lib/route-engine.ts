import { TESTNET_HOME_CHAIN } from "@/lib/network";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { useCircleCctpBridge } from "@/lib/execute-tokens";

export type RouteKind =
  | "circle-swap"
  | "circle-cctp"
  | "lifi"
  | "compound-swap-bridge";

export interface RoutePlan {
  kind: RouteKind;
  /** Chain where the user signs the primary tx */
  signChain: string;
  /** Always Arc for platform fee debit */
  feeChain: string;
  label: string;
  hint: string;
}

export function planRoute(
  fromChain: string,
  toChain: string,
  fromToken: ExecuteToken,
  toToken: ExecuteToken,
): RoutePlan {
  const sameChain = fromChain === toChain;
  const involvesArc =
    fromChain === TESTNET_HOME_CHAIN || toChain === TESTNET_HOME_CHAIN;

  if (sameChain && fromToken.symbol !== toToken.symbol) {
    if (fromChain === TESTNET_HOME_CHAIN && fromToken.circleKey && toToken.circleKey) {
      return {
        kind: "circle-swap",
        signChain: TESTNET_HOME_CHAIN,
        feeChain: TESTNET_HOME_CHAIN,
        label: "Swap on Arc",
        hint: "Circle swap · fee debited in Arc USDC",
      };
    }
    return {
      kind: "lifi",
      signChain: fromChain,
      feeChain: TESTNET_HOME_CHAIN,
      label: `Swap on ${fromChain.replace(/_/g, " ")}`,
      hint: "LI.FI swap · 0.01 USDC platform fee on Arc first",
    };
  }

  /** USDC cross-chain via Circle CCTP whenever possible (incl. Base ↔ Arc). */
  if (
    !sameChain &&
    fromToken.symbol === "USDC" &&
    toToken.symbol === "USDC" &&
    useCircleCctpBridge(fromChain, toChain, fromToken, toToken)
  ) {
    return {
      kind: "circle-cctp",
      signChain: fromChain,
      feeChain: TESTNET_HOME_CHAIN,
      label: "Circle CCTP bridge",
      hint:
        fromChain === TESTNET_HOME_CHAIN
          ? "Burn on Arc · USDC gas on Arc · fee on Arc"
          : `Burn on source chain · 0.01 USDC fee on Arc first, then sign on ${fromChain.replace(/_/g, " ")}`,
    };
  }

  if (
    !sameChain &&
    toChain === TESTNET_HOME_CHAIN &&
    toToken.symbol === "USDC" &&
    fromToken.symbol !== "USDC" &&
    fromToken.cctp === false
  ) {
    return {
      kind: "compound-swap-bridge",
      signChain: fromChain,
      feeChain: TESTNET_HOME_CHAIN,
      label: "Swap then bridge to Arc",
      hint: `Step 1: ${fromToken.symbol}→USDC on source · Step 2: USDC→Arc via CCTP · fees in Arc USDC`,
    };
  }

  if (!sameChain && involvesArc) {
    return {
      kind: "lifi",
      signChain: fromChain,
      feeChain: TESTNET_HOME_CHAIN,
      label: "Cross-chain via LI.FI",
      hint: "Route via LI.FI to/from Arc · 0.01 USDC fee on Arc",
    };
  }

  return {
    kind: "lifi",
    signChain: fromChain,
    feeChain: TESTNET_HOME_CHAIN,
    label: "Cross-chain",
    hint: "LI.FI route · fund tokens on source chain",
  };
}
