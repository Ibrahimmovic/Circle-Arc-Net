import { TESTNET_HOME_CHAIN } from "@/lib/network";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { getSwapChain, useCircleCctpBridge } from "@/lib/execute-tokens";
import { isEthToWethWrap, supportsUniswapV3 } from "@/lib/uniswap-v3";

export type RouteKind =
  | "circle-swap"
  | "circle-cctp"
  | "lifi"
  | "uniswap-v3"
  | "eth-wrap"
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
    const chainCfg = getSwapChain(fromChain);
    if (
      chainCfg &&
      isEthToWethWrap(chainCfg.lifiChainId, fromToken.symbol, toToken.symbol)
    ) {
      return {
        kind: "eth-wrap",
        signChain: fromChain,
        feeChain: TESTNET_HOME_CHAIN,
        label: `Wrap ETH → WETH`,
        hint: "Wrap native ETH to WETH · 0.01 USDC platform fee on Arc first",
      };
    }
    if (fromChain === TESTNET_HOME_CHAIN && fromToken.circleKey && toToken.circleKey) {
      return {
        kind: "circle-swap",
        signChain: TESTNET_HOME_CHAIN,
        feeChain: TESTNET_HOME_CHAIN,
        label: "Swap on Arc",
        hint: "Circle swap · fee debited in Arc USDC",
      };
    }
    const swapCfg = getSwapChain(fromChain);
    if (swapCfg && supportsUniswapV3(swapCfg.lifiChainId)) {
      return {
        kind: "uniswap-v3",
        signChain: fromChain,
        feeChain: TESTNET_HOME_CHAIN,
        label: `Swap on ${fromChain.replace(/_/g, " ")}`,
        hint: "Uniswap V3 (testnet DEX) · 0.01 USDC platform fee on Arc first",
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
          ? "3 wallet steps: Arc fee, approve USDC, then bridge burn"
          : `Arc fee, then bridge on ${fromChain.replace(/_/g, " ")}`,
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
