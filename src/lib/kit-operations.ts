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
export function summarizeBridgeEstimate(
  fees: {
    gasFees?: Array<{ name?: string; token?: string; blockchain?: string }>;
    fees?: Array<{ type?: string; amount?: string | null; token?: string }>;
  },
  bridgeAmount?: string,
): { lines: string[]; totalHint: string; walletSteps: string[] } {
  const lines: string[] = [];
  const walletSteps: string[] = [];
  let forwarderUsdc = 0;
  let protocolUsdc = 0;

  for (const g of fees.gasFees ?? []) {
    const name = (g.name ?? "step").toLowerCase();
    if (name.includes("approve")) {
      walletSteps.push("Approve USDC on Arc (one-time if needed)");
      lines.push("Wallet step: approve USDC on Arc — not subtracted from bridge amount");
    } else if (name.includes("burn")) {
      walletSteps.push("Burn / bridge on Arc");
      lines.push("Wallet step: burn on Arc — your USDC amount leaves Arc here");
    } else {
      lines.push(`${g.name ?? "Gas"}: ${g.token ?? "native"} on ${String(g.blockchain ?? "").replace(/_/g, " ")}`);
    }
  }

  for (const f of fees.fees ?? []) {
    const amt = parseFloat(f.amount ?? "0");
    if (amt <= 0) continue;
    const type = (f.type ?? "").toLowerCase();
    if (type === "forwarder") {
      forwarderUsdc += amt;
      lines.push(
        `Forwarder relayer ~${amt.toFixed(3)} USDC — Circle mints on destination so you skip Base signatures`,
      );
    } else if (type === "provider") {
      protocolUsdc += amt;
      lines.push(`CCTP protocol ~${amt.toFixed(3)} USDC (SLOW mode keeps this low)`);
    } else {
      lines.push(`${f.type}: ~${amt.toFixed(3)} ${f.token ?? "USDC"}`);
    }
  }

  const amtLabel = bridgeAmount ? `${bridgeAmount} USDC` : "your amount";
  const extras: string[] = ["~$0.01 Arc gas"];
  if (forwarderUsdc > 0) extras.push(`~${forwarderUsdc.toFixed(2)} forwarder`);
  if (protocolUsdc > 0) extras.push(`~${protocolUsdc.toFixed(2)} CCTP`);

  const totalHint =
    `You bridge ${amtLabel}. Extra wallet costs: ${extras.join(" + ")} — not deducted from ${amtLabel}.`;

  return { lines, totalHint, walletSteps };
}

export const BRIDGE_WALLET_STEPS =
  "MetaMask may show 1–2 steps on Arc: (1) approve USDC once if needed, (2) bridge burn. Circle forwarder mints on destination — you do not sign on Base.";
