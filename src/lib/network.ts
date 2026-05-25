export type NetworkMode = "testnet" | "mainnet";

export function getNetworkMode(): NetworkMode {
  const mode = process.env.NEXT_PUBLIC_NETWORK ?? "testnet";
  return mode === "mainnet" ? "mainnet" : "testnet";
}

export interface ChainOption {
  id: string;
  label: string;
  appKitName: string;
  circleFaucet?: string;
  goldrushChain?: string;
}

export const TESTNET_CHAINS: ChainOption[] = [
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    appKitName: "Base Sepolia",
    circleFaucet: "BASE-SEPOLIA",
    goldrushChain: "base-sepolia-mainnet",
  },
  {
    id: "eth-sepolia",
    label: "Ethereum Sepolia",
    appKitName: "Ethereum Sepolia",
    circleFaucet: "ETH-SEPOLIA",
    goldrushChain: "eth-sepolia",
  },
  {
    id: "arb-sepolia",
    label: "Arbitrum Sepolia",
    appKitName: "Arbitrum Sepolia",
    circleFaucet: "ARB-SEPOLIA",
    goldrushChain: "arbitrum-sepolia",
  },
  {
    id: "arc-testnet",
    label: "Arc Testnet",
    appKitName: "Arc Testnet",
    circleFaucet: "ARC-TESTNET",
  },
];

export const MAINNET_CHAINS: ChainOption[] = [
  { id: "ethereum", label: "Ethereum", appKitName: "Ethereum", goldrushChain: "eth-mainnet" },
  { id: "base", label: "Base", appKitName: "Base", goldrushChain: "base-mainnet" },
  { id: "arbitrum", label: "Arbitrum", appKitName: "Arbitrum", goldrushChain: "arbitrum-mainnet" },
  { id: "polygon", label: "Polygon", appKitName: "Polygon", goldrushChain: "polygon-mainnet" },
  { id: "optimism", label: "Optimism", appKitName: "Optimism", goldrushChain: "optimism-mainnet" },
];

export function getChains(): ChainOption[] {
  return getNetworkMode() === "testnet" ? TESTNET_CHAINS : MAINNET_CHAINS;
}

/** GoldRush allchains testnet slugs often 501 — use mainnet + per-chain sepolia. */
export function getGoldRushChainList(): string {
  return "eth-mainnet,base-mainnet,arbitrum-mainnet,optimism-mainnet";
}

export function getGoldRushSepoliaChains(): string[] {
  return ["eth-sepolia"];
}

export function findChainByAppKit(name: string): ChainOption | undefined {
  return getChains().find(
    (c) => c.appKitName.toLowerCase() === name.toLowerCase(),
  );
}
