import type { NetworkMode } from "@/lib/network";
import { BRIDGE_CHAINS_MAINNET } from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import {
  getTestnetSwapChains,
  getTokensForChain,
  type ExecuteToken,
} from "@/lib/execute-tokens";

export interface ExecChain {
  appKitChain: string;
  label: string;
  lifiChainId: number;
  wagmiChainId: number;
}

const MAINNET_TOKENS: Record<string, ExecuteToken[]> = {
  Ethereum: [
    { symbol: "ETH", name: "Ether", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, circleKey: "USDC", cctp: true },
    { symbol: "WETH", name: "Wrapped Ether", address: "WETH", decimals: 18, cctp: false },
  ],
  Base: [
    { symbol: "ETH", name: "Ether", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, circleKey: "USDC", cctp: true },
    { symbol: "WETH", name: "Wrapped Ether", address: "WETH", decimals: 18, cctp: false },
  ],
  Arbitrum: [
    { symbol: "ETH", name: "Ether", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, circleKey: "USDC", cctp: true },
    { symbol: "WETH", name: "Wrapped Ether", address: "WETH", decimals: 18, cctp: false },
  ],
  Polygon: [
    { symbol: "MATIC", name: "Polygon", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, circleKey: "USDC", cctp: true },
  ],
  Optimism: [
    { symbol: "ETH", name: "Ether", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, circleKey: "USDC", cctp: true },
  ],
  Avalanche: [
    { symbol: "AVAX", name: "Avalanche", address: "0x0000000000000000000000000000000000000000", decimals: 18, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, cctp: true },
  ],
  Solana: [
    { symbol: "SOL", name: "Solana", address: "SOL", decimals: 9, cctp: false },
    { symbol: "USDC", name: "USD Coin", address: "USDC", decimals: 6, cctp: false },
  ],
};

/** LI.FI Solana mainnet chain id */
export const LIFI_SOLANA_CHAIN_ID = 1151111086941641741;

const MAINNET_LIFI_IDS: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Polygon: 137,
  Optimism: 10,
  Avalanche: 43114,
  Solana: LIFI_SOLANA_CHAIN_ID,
};

export function getExecChains(mode: NetworkMode): ExecChain[] {
  if (mode === "testnet") {
    return getTestnetSwapChains().map((c) => ({
      appKitChain: c.appKitChain,
      label: c.label,
      lifiChainId: c.lifiChainId,
      wagmiChainId: c.wagmiChainId,
    }));
  }
  return BRIDGE_CHAINS_MAINNET.map((c) => ({
    appKitChain: c.appKitChain,
    label: c.label,
    lifiChainId: MAINNET_LIFI_IDS[c.appKitChain] ?? 1,
    wagmiChainId: wagmiChainIdForAppKit(c.appKitChain) ?? 1,
  }));
}

export function getExecTokens(appKitChain: string, mode: NetworkMode): ExecuteToken[] {
  if (mode === "testnet") return getTokensForChain(appKitChain);
  return MAINNET_TOKENS[appKitChain] ?? MAINNET_TOKENS.Ethereum ?? [];
}

export function findExecToken(
  appKitChain: string,
  symbol: string,
  mode: NetworkMode,
): ExecuteToken | undefined {
  return getExecTokens(appKitChain, mode).find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase(),
  );
}

export function getExecChain(appKitChain: string, mode: NetworkMode): ExecChain | undefined {
  return getExecChains(mode).find((c) => c.appKitChain === appKitChain);
}
