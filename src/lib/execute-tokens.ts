import type { ChainOption } from "@/lib/network";
import { TESTNET_HOME_CHAIN } from "@/lib/network";

export type ExecuteProvider = "circle" | "lifi";

export interface ExecuteToken {
  symbol: string;
  name: string;
  /** LiFi / on-chain address; Circle uses `circleKey` when set */
  address: string;
  decimals: number;
  circleKey?: string;
  /** Can move via Circle CCTP bridge */
  cctp?: boolean;
}

export interface SwapChainConfig extends ChainOption {
  wagmiChainId: number;
  lifiChainId: number;
  swapProvider: ExecuteProvider;
}

/** Testnet chains with same-chain swap (Circle on Arc, LiFi on major Sepolia L2s). */
export const TESTNET_SWAP_CHAINS: SwapChainConfig[] = [
  {
    id: "arc",
    label: "Arc Testnet",
    appKitChain: "Arc_Testnet",
    circleFaucet: "ARC-TESTNET",
    isArc: true,
    bridge: true,
    swap: true,
    wagmiChainId: 5042002,
    lifiChainId: 5042002,
    swapProvider: "circle",
  },
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    appKitChain: "Base_Sepolia",
    circleFaucet: "BASE-SEPOLIA",
    goldrushChain: "base-sepolia",
    bridge: true,
    swap: true,
    wagmiChainId: 84532,
    lifiChainId: 84532,
    swapProvider: "lifi",
  },
  {
    id: "eth-sepolia",
    label: "Ethereum Sepolia",
    appKitChain: "Ethereum_Sepolia",
    circleFaucet: "ETH-SEPOLIA",
    goldrushChain: "eth-sepolia",
    bridge: true,
    swap: true,
    wagmiChainId: 11155111,
    lifiChainId: 11155111,
    swapProvider: "lifi",
  },
  {
    id: "arb-sepolia",
    label: "Arbitrum Sepolia",
    appKitChain: "Arbitrum_Sepolia",
    circleFaucet: "ARB-SEPOLIA",
    bridge: true,
    swap: true,
    wagmiChainId: 421614,
    lifiChainId: 421614,
    swapProvider: "lifi",
  },
  {
    id: "op-sepolia",
    label: "Optimism Sepolia",
    appKitChain: "Optimism_Sepolia",
    circleFaucet: "OP-SEPOLIA",
    bridge: true,
    swap: true,
    wagmiChainId: 11155420,
    lifiChainId: 11155420,
    swapProvider: "lifi",
  },
];

/** Known testnet tokens per chain (LiFi + Circle where applicable). */
export const TESTNET_TOKENS: Record<string, ExecuteToken[]> = {
  Arc_Testnet: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3600000000000000000000000000000000000000",
      decimals: 6,
      circleKey: "USDC",
      cctp: true,
    },
    {
      symbol: "EURC",
      name: "Euro Coin",
      address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      decimals: 6,
      circleKey: "EURC",
      cctp: true,
    },
  ],
  Base_Sepolia: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x036CbD53842c542663c210983784c9c6Ca01eC09",
      decimals: 6,
      circleKey: "USDC",
      cctp: true,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0x5fd84259d66Cd4612354860Fe1Bc3c7f356E7d56",
      decimals: 6,
      cctp: false,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      circleKey: "WETH",
      cctp: false,
    },
    {
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      circleKey: "NATIVE",
      cctp: false,
    },
  ],
  Ethereum_Sepolia: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x94a9D9AC0a225Fb34a2c79dd2aF583bfFDDe3Ed0",
      decimals: 6,
      circleKey: "USDC",
      cctp: true,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xaA8E23Fb1079EA71e0a56F48aEAfaFd16E5a5cF3",
      decimals: 6,
      cctp: false,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0xfff9976782d46b82556a8536b9925a3af0bb5e3b",
      decimals: 18,
      circleKey: "WETH",
      cctp: false,
    },
    {
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      circleKey: "NATIVE",
      cctp: false,
    },
  ],
  Arbitrum_Sepolia: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x75faf114eafb1BDbe2F05490Efd5AD74ac889A56",
      decimals: 6,
      circleKey: "USDC",
      cctp: true,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0x980B62Da83eFf3D4576C6489938De1e5E8e6A155",
      decimals: 18,
      circleKey: "WETH",
      cctp: false,
    },
    {
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      circleKey: "NATIVE",
      cctp: false,
    },
  ],
  Optimism_Sepolia: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x5fd84259d66Cd4612354860Fe1Bc3c7f356E7d56",
      decimals: 6,
      circleKey: "USDC",
      cctp: true,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      circleKey: "WETH",
      cctp: false,
    },
    {
      symbol: "ETH",
      name: "Ether",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      circleKey: "NATIVE",
      cctp: false,
    },
  ],
};

export function getTestnetSwapChains(): SwapChainConfig[] {
  return TESTNET_SWAP_CHAINS;
}

export function getTokensForChain(appKitChain: string): ExecuteToken[] {
  return TESTNET_TOKENS[appKitChain] ?? [];
}

export function getSwapChain(appKitChain: string): SwapChainConfig | undefined {
  return TESTNET_SWAP_CHAINS.find((c) => c.appKitChain === appKitChain);
}

/** Circle CCTP when both sides are USDC (or EURC with Arc). */
export function useCircleCctpBridge(
  fromChain: string,
  toChain: string,
  fromToken: ExecuteToken,
  toToken: ExecuteToken,
): boolean {
  if (fromToken.symbol !== toToken.symbol) return false;
  if (!fromToken.cctp || !toToken.cctp) return false;
  if (fromToken.symbol === "EURC") {
    return fromChain === TESTNET_HOME_CHAIN || toChain === TESTNET_HOME_CHAIN;
  }
  return fromToken.symbol === "USDC";
}

export function toBaseUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${padded}`.replace(/^0+/, "") || "0";
  return combined;
}
