/** Circle App Kit chain IDs — must match enum exactly (underscores, not spaces). */

export type NetworkMode = "testnet" | "mainnet";

export interface ChainOption {
  id: string;
  label: string;
  /** Value passed to App Kit bridge/swap */
  appKitChain: string;
  circleFaucet?: string;
  goldrushChain?: string;
  isArc?: boolean;
  bridge: boolean;
  swap: boolean;
}

/** CCTP bridge — testnet */
export const BRIDGE_CHAINS_TESTNET: ChainOption[] = [
  {
    id: "arc",
    label: "Arc Testnet",
    appKitChain: "Arc_Testnet",
    circleFaucet: "ARC-TESTNET",
    isArc: true,
    bridge: true,
    swap: true,
  },
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    appKitChain: "Base_Sepolia",
    circleFaucet: "BASE-SEPOLIA",
    goldrushChain: "eth-sepolia",
    bridge: true,
    swap: false,
  },
  {
    id: "eth-sepolia",
    label: "Ethereum Sepolia",
    appKitChain: "Ethereum_Sepolia",
    circleFaucet: "ETH-SEPOLIA",
    goldrushChain: "eth-sepolia",
    bridge: true,
    swap: false,
  },
  {
    id: "arb-sepolia",
    label: "Arbitrum Sepolia",
    appKitChain: "Arbitrum_Sepolia",
    circleFaucet: "ARB-SEPOLIA",
    bridge: true,
    swap: false,
  },
  {
    id: "op-sepolia",
    label: "Optimism Sepolia",
    appKitChain: "Optimism_Sepolia",
    circleFaucet: "OP-SEPOLIA",
    bridge: true,
    swap: false,
  },
  {
    id: "avax-fuji",
    label: "Avalanche Fuji",
    appKitChain: "Avalanche_Fuji",
    bridge: true,
    swap: false,
  },
];

/** CCTP bridge + swap — mainnet */
export const BRIDGE_CHAINS_MAINNET: ChainOption[] = [
  {
    id: "ethereum",
    label: "Ethereum",
    appKitChain: "Ethereum",
    goldrushChain: "eth-mainnet",
    bridge: true,
    swap: true,
  },
  {
    id: "base",
    label: "Base",
    appKitChain: "Base",
    goldrushChain: "base-mainnet",
    bridge: true,
    swap: true,
  },
  {
    id: "arbitrum",
    label: "Arbitrum",
    appKitChain: "Arbitrum",
    goldrushChain: "arbitrum-mainnet",
    bridge: true,
    swap: true,
  },
  {
    id: "polygon",
    label: "Polygon",
    appKitChain: "Polygon",
    goldrushChain: "polygon-mainnet",
    bridge: true,
    swap: true,
  },
  {
    id: "optimism",
    label: "Optimism",
    appKitChain: "Optimism",
    goldrushChain: "optimism-mainnet",
    bridge: true,
    swap: true,
  },
  {
    id: "avalanche",
    label: "Avalanche",
    appKitChain: "Avalanche",
    bridge: true,
    swap: true,
  },
  {
    id: "solana",
    label: "Solana",
    appKitChain: "Solana",
    bridge: true,
    swap: true,
  },
];

export function getBridgeChains(mode: NetworkMode): ChainOption[] {
  return mode === "testnet" ? BRIDGE_CHAINS_TESTNET : BRIDGE_CHAINS_MAINNET;
}

export function getSwapChains(mode: NetworkMode): ChainOption[] {
  const chains = getBridgeChains(mode);
  return chains.filter((c) => c.swap);
}

export function getGoldRushChainList(_mode: NetworkMode): string {
  return "eth-mainnet,base-mainnet,arbitrum-mainnet,optimism-mainnet";
}

export function getGoldRushSepoliaChains(): string[] {
  return ["eth-sepolia"];
}

export const ARC_FEE_USDC = "~$0.01 USDC on Arc";
