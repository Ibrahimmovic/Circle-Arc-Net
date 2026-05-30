/** Circle App Kit chain IDs — must match enum exactly (underscores, not spaces). */

import { getTestnetSwapChains } from "@/lib/execute-tokens";

export type NetworkMode = "testnet" | "mainnet";

/**
 * Server APIs: ?network=mainnet|testnet overrides env.
 * Default mainnet for production; users switch via header toggle or ?network=testnet.
 */
export function resolveApiTestnet(networkParam: string | null): boolean {
  if (networkParam === "mainnet") return false;
  if (networkParam === "testnet") return true;
  return (process.env.NEXT_PUBLIC_NETWORK ?? "mainnet") !== "mainnet";
}

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
  {
    id: "linea-sepolia",
    label: "Linea Sepolia",
    appKitChain: "Linea_Sepolia",
    bridge: true,
    swap: false,
  },
  {
    id: "polygon-amoy",
    label: "Polygon Amoy",
    appKitChain: "Polygon_Amoy_Testnet",
    circleFaucet: "MATIC-AMOY",
    bridge: true,
    swap: false,
  },
  {
    id: "unichain-sepolia",
    label: "Unichain Sepolia",
    appKitChain: "Unichain_Sepolia",
    bridge: true,
    swap: false,
  },
  {
    id: "world-sepolia",
    label: "World Chain Sepolia",
    appKitChain: "World_Chain_Sepolia",
    bridge: true,
    swap: false,
  },
  {
    id: "sonic-testnet",
    label: "Sonic Testnet",
    appKitChain: "Sonic_Testnet",
    bridge: true,
    swap: false,
  },
  {
    id: "monad-testnet",
    label: "Monad Testnet",
    appKitChain: "Monad_Testnet",
    bridge: true,
    swap: false,
  },
  {
    id: "sei-testnet",
    label: "Sei Testnet",
    appKitChain: "Sei_Testnet",
    bridge: true,
    swap: false,
  },
];

/** Testnet: Arc is the fee hub — swaps only on Arc; bridges out from Arc use Arc USDC. */
export const TESTNET_ARC_HUB = true;

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
  if (mode === "testnet") return getTestnetSwapChains();
  const chains = getBridgeChains(mode);
  return chains.filter((c) => c.swap);
}

export function getGoldRushChainList(_mode: NetworkMode): string {
  return "eth-mainnet,base-mainnet,arbitrum-mainnet,optimism-mainnet";
}

export function getGoldRushSepoliaChains(): string[] {
  return ["eth-sepolia", "base-sepolia"];
}

/** Mainnet multichain balance scan (not Base-only). */
export function getGoldRushMainnetChains(): string {
  return (
    process.env.GOLDRUSH_CHAINS ??
    "eth-mainnet,base-mainnet,polygon-mainnet,arbitrum-mainnet,optimism-mainnet,avalanche-mainnet,bsc-mainnet"
  );
}

export const ARC_FEE_USDC = "~$0.01 USDC on Arc";

/** Human-readable gas token per chain (Circle CCTP pays gas on the chain where each step runs). */
const GAS_TOKEN_BY_CHAIN: Record<string, string> = {
  Arc_Testnet: "USDC",
  Base_Sepolia: "ETH",
  Ethereum_Sepolia: "ETH",
  Arbitrum_Sepolia: "ETH",
  Optimism_Sepolia: "ETH",
  Avalanche_Fuji: "AVAX",
  Ethereum: "ETH",
  Base: "ETH",
  Arbitrum: "ETH",
  Polygon: "MATIC",
  Optimism: "ETH",
  Avalanche: "AVAX",
};

export function getGasToken(appKitChain: string): string {
  return GAS_TOKEN_BY_CHAIN[appKitChain] ?? "native";
}

/** Primary chain user should connect to on testnet (Arc-first, not Base Sepolia). */
export const TESTNET_HOME_CHAIN = "Arc_Testnet";

/**
 * Fee settlement copy: gas is paid on the chain where approve/burn/mint runs.
 * - From Arc → Arc USDC gas
 * - From Base → Base Sepolia ETH gas (+ USDC on Arc only if you mint there)
 */
export function describeTestnetArcHubFees(): string {
  return "Testnet Arc hub: keep wallet on Arc Testnet. Swaps & outbound bridges debit Arc USDC (~$0.01). Destination mints use Circle forwarder (fewer extra chain txs).";
}

export function describeBridgeFees(
  fromAppKit: string,
  toAppKit: string,
  mode: NetworkMode = "testnet",
): {
  summary: string;
  sourceLine: string;
  destLine: string;
  arcPreferred: boolean;
} {
  const chains = getBridgeChains(mode);
  const fromLabel =
    chains.find((c) => c.appKitChain === fromAppKit)?.label ?? fromAppKit;
  const toLabel =
    chains.find((c) => c.appKitChain === toAppKit)?.label ?? toAppKit;

  const fromIsArc = fromAppKit === "Arc_Testnet";
  const toIsArc = toAppKit === "Arc_Testnet";
  const fromGas = getGasToken(fromAppKit);
  const toGas = getGasToken(toAppKit);

  const sourceLine = fromIsArc
    ? `Source (burn on Arc): gas in Arc USDC (~$0.01 typical)`
    : `Source (burn on ${fromLabel}): gas in ${fromGas} on that chain`;

  const destLine = toIsArc
    ? `Destination (mint on Arc): gas in Arc USDC if you submit mint; Circle forwarder can relay`
    : `Destination (mint on ${toLabel}): gas in ${toGas} on that chain`;

  let summary: string;
  if (fromIsArc && !toIsArc) {
    summary =
      "Arc → other: you sign on Arc only (USDC gas). Circle forwarder handles destination mint.";
  } else if (!fromIsArc && toIsArc) {
    summary = `Fees for this route: source burn paid in ${fromGas} on ${fromLabel}; mint side uses Arc USDC.`;
  } else if (fromIsArc && toIsArc) {
    summary = "Fees: Arc USDC only (Arc-native gas).";
  } else {
    summary = `Fees: ${fromGas} on ${fromLabel} (source) · ${toGas} on ${toLabel} (destination mint).`;
  }

  return { summary, sourceLine, destLine, arcPreferred: fromIsArc || toIsArc };
}

export function describeSwapFees(appKitChain: string): string {
  if (appKitChain === "Arc_Testnet") {
    return "Swap gas & protocol fees: Arc Testnet USDC (native gas on Arc).";
  }
  const gas = getGasToken(appKitChain);
  return `Swap fees: paid on ${appKitChain.replace(/_/g, " ")} in ${gas} + USDC where applicable.`;
}

export type GasFeeLine = {
  step: string;
  chain: string;
  token: string;
};

/** Format Circle estimateBridge gasFees for UI. */
export function formatKitGasFees(
  gasFees: Array<{ name?: string; blockchain?: string; token?: string }> | undefined,
): GasFeeLine[] {
  if (!gasFees?.length) return [];
  return gasFees.map((g) => ({
    step: g.name ?? "step",
    chain: String(g.blockchain ?? "").replace(/_/g, " "),
    token: g.token ?? "native",
  }));
}
