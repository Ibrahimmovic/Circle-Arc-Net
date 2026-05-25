import { createPublicClient, formatUnits, http } from "viem";
import { baseSepolia, arbitrumSepolia, optimismSepolia } from "viem/chains";
import { arcTestnet } from "@/lib/chains";
import { getExplorer } from "@/lib/explorers";
import { APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";
import type { BridgeResult } from "@circle-fin/app-kit";

export interface TxScanStep {
  label: string;
  hash: string;
  chainId: number;
  status?: "success" | "error" | "pending";
  gasDisplay?: string;
}

function clientForChain(chainId: number) {
  const transport = http(
    chainId === 5042002
      ? "https://rpc.testnet.arc.network"
      : chainId === 84532
        ? "https://sepolia.base.org"
        : chainId === 421614
          ? "https://sepolia-rollup.arbitrum.io/rpc"
          : chainId === 11155420
            ? "https://sepolia.optimism.io"
            : "https://rpc.sepolia.org",
  );
  const chain =
    chainId === 5042002
      ? arcTestnet
      : chainId === 84532
        ? baseSepolia
        : chainId === 421614
          ? arbitrumSepolia
          : chainId === 11155420
            ? optimismSepolia
            : undefined;
  return createPublicClient({ chain, transport });
}

export async function fetchTxGas(
  chainId: number,
  hash: string,
): Promise<string | undefined> {
  const explorer = getExplorer(chainId);
  if (!explorer) return undefined;
  try {
    const client = clientForChain(chainId);
    const receipt = await client.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });
    if (!receipt) return undefined;
    const paid =
      receipt.gasUsed *
      (receipt.effectiveGasPrice ?? BigInt(0));
    const formatted = formatUnits(paid, explorer.gasDecimals);
    const n = parseFloat(formatted);
    const display =
      n < 0.000001
        ? "<0.000001"
        : n < 0.01
          ? n.toFixed(6)
          : n.toFixed(4);
    return `${display} ${explorer.gasSymbol}`;
  } catch {
    return undefined;
  }
}

export function scanStep(
  label: string,
  hash: string,
  chainId: number,
  status: TxScanStep["status"] = "success",
): TxScanStep {
  return { label, hash, chainId, status };
}

export function arcFeeScanStep(hash: string): TxScanStep {
  return scanStep("Platform fee (Arc)", hash, 5042002);
}

/** Map Circle bridge steps → explorer links on source vs destination chain. */
export function bridgeStepsFromResult(
  result: BridgeResult,
  fromAppKitChain: string,
  toAppKitChain: string,
): TxScanStep[] {
  const sourceId = APP_KIT_TO_WAGMI_CHAIN_ID[fromAppKitChain] ?? 5042002;
  const destId = APP_KIT_TO_WAGMI_CHAIN_ID[toAppKitChain] ?? sourceId;
  const steps: TxScanStep[] = [];

  for (const s of result.steps ?? []) {
    if (!s.txHash) continue;
    const name = (s.name ?? "").toLowerCase();
    const chainId =
      name.includes("mint") || name.includes("destination")
        ? destId
        : sourceId;
    const state = (s.state ?? "success").toLowerCase();
    const status: TxScanStep["status"] =
      state === "error" || state === "failed" || state === "reverted"
        ? "error"
        : state === "pending"
          ? "pending"
          : "success";
    const label =
      name === "approve"
        ? "Approve USDC"
        : name === "burn"
          ? "Bridge burn"
          : name === "mint"
            ? "Mint on destination"
            : s.name ?? "Bridge step";
    steps.push(scanStep(label, s.txHash, chainId, status));
  }

  return steps;
}

export function mergeScanSteps(...groups: TxScanStep[][]): TxScanStep[] {
  const seen = new Set<string>();
  const out: TxScanStep[] = [];
  for (const g of groups) {
    for (const s of g) {
      const key = `${s.chainId}:${s.hash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

export { explorerLabel, txExplorerLink, addressExplorerLink } from "@/lib/explorers";
