import type { BridgeConfig } from "@circle-fin/app-kit";
import { TESTNET_HOME_CHAIN } from "@/lib/network";

export function getSwapKitConfig(kitKey: string) {
  return {
    kitKey,
    allowanceStrategy: "permit" as const,
    slippageBps: 150,
  };
}

/**
 * Bridge config: batch approve+burn when wallet supports it.
 * SLOW = no CCTP fast-transfer protocol fee (cheaper; ~15 min).
 */
export function getBridgeKitConfig(preferFewerFees = true): BridgeConfig {
  return {
    batchTransactions: true,
    transferSpeed: preferFewerFees ? "SLOW" : "FAST",
    maxFee: "0.05",
  };
}

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

/** Human-readable fee summary from Circle estimate. */
export function summarizeBridgeEstimate(fees: {
  gasFees?: Array<{ name?: string; token?: string; blockchain?: string }>;
  fees?: Array<{ type?: string; amount?: string | null; token?: string }>;
}): { lines: string[]; totalHint: string } {
  const lines: string[] = [];
  let protocolUsdc = 0;

  for (const g of fees.gasFees ?? []) {
    lines.push(`${g.name ?? "Gas"}: ${g.token ?? "native"} on ${String(g.blockchain ?? "").replace(/_/g, " ")}`);
  }
  for (const f of fees.fees ?? []) {
    const amt = parseFloat(f.amount ?? "0");
    if (f.type === "provider" && amt > 0) protocolUsdc += amt;
    if (amt > 0) lines.push(`${f.type}: ~${amt} ${f.token ?? "USDC"}`);
  }

  const totalHint =
    protocolUsdc > 0
      ? `Est. CCTP fee ~${protocolUsdc.toFixed(2)} USDC + Arc gas (~$0.01)`
      : "Est. Arc USDC gas ~$0.01 · no fast-transfer fee (SLOW mode)";

  return { lines, totalHint };
}

export const BRIDGE_WALLET_STEPS =
  "MetaMask may show 1–2 steps on Arc: (1) approve USDC once if needed, (2) bridge burn. Circle forwarder mints on destination — you do not sign on Base.";
