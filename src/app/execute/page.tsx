"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { useNetwork } from "@/providers/network-context";
import { ARC_FEE_USDC } from "@/lib/network";

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
      subtitle="Circle CCTP Bridge · Swap Kit · Faucet · USDC fees on Arc"
    >
      <div className="space-y-6">
        <MarketTicker />
        {!isConnected && (
          <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            Connect wallet (top-right) · {network} mode · Testnet swaps on Arc
            Testnet · {ARC_FEE_USDC}
            {isTestnet ? " · Fund via Fund tab first" : ""}
          </p>
        )}
        <ExecuteHub />
      </div>
    </AppShell>
  );
}
