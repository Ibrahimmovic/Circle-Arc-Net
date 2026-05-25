import { defineChain } from "viem";

/** Circle Arc Testnet — USDC is native gas (chainId 5042002). */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

/** Map Circle App Kit chain id → wagmi chain id for wallet network switch. */
export const APP_KIT_TO_WAGMI_CHAIN_ID: Record<string, number> = {
  Arc_Testnet: arcTestnet.id,
  Base_Sepolia: 84532,
  Ethereum_Sepolia: 11155111,
  Arbitrum_Sepolia: 421614,
  Optimism_Sepolia: 11155420,
  Avalanche_Fuji: 43113,
  Linea_Sepolia: 59141,
  Polygon_Amoy_Testnet: 80002,
  Unichain_Sepolia: 1301,
  World_Chain_Sepolia: 4801,
  Sonic_Testnet: 57054,
  Monad_Testnet: 10143,
  Sei_Testnet: 1328,
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Polygon: 137,
  Optimism: 10,
  Avalanche: 43114,
};

export function wagmiChainIdForAppKit(appKitChain: string): number | undefined {
  return APP_KIT_TO_WAGMI_CHAIN_ID[appKitChain];
}
