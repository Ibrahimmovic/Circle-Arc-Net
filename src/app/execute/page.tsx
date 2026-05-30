"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { useNetwork } from "@/providers/network-context";
import { ARC_FEE_USDC } from "@/lib/network";

const CrossChainExecutionStack = dynamic(
  () =>
    import("@/components/execute/cross-chain-execution-stack").then((m) => ({
      default: m.CrossChainExecutionStack,
    })),
  { ssr: false, loading: () => null },
);

const ExecuteHub = dynamic(
  () =>
    import("@/components/execute/execute-hub").then((m) => ({
      default: m.ExecuteHub,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    ),
  },
);

export default function ExecutePage() {
  const { isConnected } = useAccount();
  const { isTestnet, network } = useNetwork();

  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Engine · queue · CCTP bridge & swap · Arc USDC fees"
    >
      <div className="space-y-6">
        <MarketTicker />
        {!isConnected && isTestnet && (
          <p className="mx-auto max-w-md rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-100">
            Connect wallet · fund Arc USDC first · {ARC_FEE_USDC}
          </p>
        )}
        <CrossChainExecutionStack />
        <ExecuteHub />
      </div>
    </AppShell>
  );
}
