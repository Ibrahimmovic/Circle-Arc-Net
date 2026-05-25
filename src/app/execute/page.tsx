"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";

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
  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Circle CCTP Bridge · Swap Kit · Faucet · USDC fees on Arc"
    >
      <div className="space-y-6">
        <MarketTicker />
        <ExecuteHub />
      </div>
    </AppShell>
  );
}
