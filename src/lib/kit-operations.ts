import type { BridgeConfig } from "@circle-fin/app-kit";
import { TESTNET_HOME_CHAIN } from "@/lib/network";

/** Swap config: permit first = fewer wallet popups when supported. */
export function getSwapKitConfig(kitKey: string) {
  return {
    kitKey,
    allowanceStrategy: "permit" as const,
    slippageBps: 150,
  };
}

/** Bridge: batch approve+burn when wallet supports EIP-5792. */
export function getBridgeKitConfig(): BridgeConfig {
  return {
    batchTransactions: true,
    transferSpeed: "FAST",
  };
}

/** Testnet: Circle forwarder mints on destination — you sign only on Arc for Arc→X. */
export function getBridgeDestination(
  toChain: string,
  adapter: unknown,
  network: "testnet" | "mainnet",
  recipientAddress?: string,
) {
  const base =
    network === "testnet" && toChain !== TESTNET_HOME_CHAIN
      ? { adapter, chain: toChain, useForwarder: true as const }
      : { adapter, chain: toChain };

  if (recipientAddress && /^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
    return { ...base, recipientAddress };
  }
  return base;
}
