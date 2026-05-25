import { summarizeBridgeEstimate } from "@/lib/kit-operations";
import { ARC_PLATFORM_FEE_LABEL } from "@/lib/arc-platform-fee";

export type GasPreviewLine = {
  id: string;
  label: string;
  cost: string;
  kind: "fee" | "gas" | "protocol";
};

export type GasPreview = {
  lines: GasPreviewLine[];
  totalGasHint: string;
  walletPopups: number;
  walletNote: string;
};

/** Build UI gas breakdown from Circle estimateBridge response. */
export function gasPreviewFromBridgeEstimate(
  estimate: {
    gasFees?: Array<{
      name?: string;
      token?: string;
      blockchain?: string;
      amount?: string;
    }>;
    fees?: Array<{ type?: string; amount?: string | null; token?: string }>;
  },
  bridgeAmount: string,
  batchedApproveBurn = true,
): GasPreview {
  const lines: GasPreviewLine[] = [
    {
      id: "platform",
      label: "Platform fee (Arc)",
      cost: ARC_PLATFORM_FEE_LABEL,
      kind: "fee",
    },
  ];

  let gasUsdc = 0;
  let hasApprove = false;
  let hasBurn = false;

  for (const g of estimate.gasFees ?? []) {
    const name = (g.name ?? "").toLowerCase();
    const token = g.token ?? "USDC";
    const amt = parseFloat(String(g.amount ?? "0")) || 0;
    if (name.includes("approve")) {
      hasApprove = true;
      lines.push({
        id: "approve-gas",
        label: "Allowance gas (Arc)",
        cost: `~${amt > 0 ? amt.toFixed(6) : "0.001"} ${token}`,
        kind: "gas",
      });
      gasUsdc += amt;
    } else if (name.includes("burn")) {
      hasBurn = true;
      lines.push({
        id: "burn-gas",
        label: "Bridge burn gas (Arc)",
        cost: `~${amt > 0 ? amt.toFixed(6) : "0.004"} ${token}`,
        kind: "gas",
      });
      gasUsdc += amt;
    } else if (amt > 0) {
      lines.push({
        id: `gas-${name}`,
        label: `${g.name ?? "Gas"} (${String(g.blockchain ?? "").replace(/_/g, " ")})`,
        cost: `~${amt.toFixed(6)} ${token}`,
        kind: "gas",
      });
      gasUsdc += amt;
    }
  }

  for (const f of estimate.fees ?? []) {
    const amt = parseFloat(f.amount ?? "0");
    if (amt <= 0) continue;
    lines.push({
      id: `protocol-${f.type}`,
      label: f.type === "forwarder" ? "Forwarder (Circle)" : `CCTP ${f.type ?? "fee"}`,
      cost: `~${amt.toFixed(4)} ${f.token ?? "USDC"}`,
      kind: "protocol",
    });
  }

  const summary = summarizeBridgeEstimate(estimate, bridgeAmount);
  const walletPopups = batchedApproveBurn && hasApprove && hasBurn ? 2 : hasApprove && hasBurn ? 3 : 2;

  const walletNote =
    batchedApproveBurn && hasApprove
      ? "Wallet: (1) Arc fee, (2) bridge — approve + burn are often one popup (batched)."
      : "Wallet: (1) Arc fee, (2) approve USDC if needed, (3) bridge burn.";

  return {
    lines,
    totalGasHint:
      gasUsdc > 0
        ? `~${gasUsdc.toFixed(4)} USDC gas on Arc + ${ARC_PLATFORM_FEE_LABEL} platform fee`
        : `~${ARC_PLATFORM_FEE_LABEL} platform fee + small Arc USDC gas`,
    walletPopups,
    walletNote,
  };
}

export function gasPreviewForSwap(chainLabel: string): GasPreview {
  return {
    lines: [
      {
        id: "platform",
        label: "Platform fee (Arc)",
        cost: ARC_PLATFORM_FEE_LABEL,
        kind: "fee",
      },
      {
        id: "swap-gas",
        label: `Swap gas (${chainLabel})`,
        cost: "~0.001–0.01 (chain native or USDC)",
        kind: "gas",
      },
    ],
    totalGasHint: `${ARC_PLATFORM_FEE_LABEL} + swap gas on ${chainLabel}`,
    walletPopups: 2,
    walletNote: "Wallet: (1) Arc fee, (2) swap on selected chain.",
  };
}
