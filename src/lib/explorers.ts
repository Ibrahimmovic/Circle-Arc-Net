import { APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";

export interface ChainExplorer {
  chainId: number;
  name: string;
  txUrl: (hash: string) => string;
  addressUrl: (address: string) => string;
  /** Native gas token label for display */
  gasSymbol: string;
  gasDecimals: number;
}

const EXPLORERS: Record<number, ChainExplorer> = {
  5042002: {
    chainId: 5042002,
    name: "Arcscan",
    txUrl: (h) => `https://testnet.arcscan.app/tx/${h}`,
    addressUrl: (a) => `https://testnet.arcscan.app/address/${a}`,
    gasSymbol: "USDC",
    gasDecimals: 18,
  },
  84532: {
    chainId: 84532,
    name: "Basescan",
    txUrl: (h) => `https://sepolia.basescan.org/tx/${h}`,
    addressUrl: (a) => `https://sepolia.basescan.org/address/${a}`,
    gasSymbol: "ETH",
    gasDecimals: 18,
  },
  11155111: {
    chainId: 11155111,
    name: "Etherscan",
    txUrl: (h) => `https://sepolia.etherscan.io/tx/${h}`,
    addressUrl: (a) => `https://sepolia.etherscan.io/address/${a}`,
    gasSymbol: "ETH",
    gasDecimals: 18,
  },
  421614: {
    chainId: 421614,
    name: "Arbiscan",
    txUrl: (h) => `https://sepolia.arbiscan.io/tx/${h}`,
    addressUrl: (a) => `https://sepolia.arbiscan.io/address/${a}`,
    gasSymbol: "ETH",
    gasDecimals: 18,
  },
  11155420: {
    chainId: 11155420,
    name: "Optimism Sepolia",
    txUrl: (h) => `https://sepolia-optimism.etherscan.io/tx/${h}`,
    addressUrl: (a) => `https://sepolia-optimism.etherscan.io/address/${a}`,
    gasSymbol: "ETH",
    gasDecimals: 18,
  },
};

export function getExplorer(chainId: number): ChainExplorer | undefined {
  return EXPLORERS[chainId];
}

export function explorerForAppKitChain(appKitChain: string): ChainExplorer | undefined {
  const id = APP_KIT_TO_WAGMI_CHAIN_ID[appKitChain];
  return id != null ? EXPLORERS[id] : undefined;
}

export function chainIdsForRoute(fromAppKit: string, toAppKit: string): number[] {
  const ids = new Set<number>();
  const a = APP_KIT_TO_WAGMI_CHAIN_ID[fromAppKit];
  const b = APP_KIT_TO_WAGMI_CHAIN_ID[toAppKit];
  if (a != null) ids.add(a);
  if (b != null) ids.add(b);
  ids.add(5042002);
  return [...ids];
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function txExplorerLink(chainId: number, hash: string): string | undefined {
  return getExplorer(chainId)?.txUrl(hash);
}

export function addressExplorerLink(
  chainId: number,
  address: string,
): string | undefined {
  return getExplorer(chainId)?.addressUrl(address);
}

export function explorerLabel(chainId: number): string {
  return getExplorer(chainId)?.name ?? `Chain ${chainId}`;
}
