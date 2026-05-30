"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { useNetwork } from "@/providers/network-context";
import { ARC_FEE_USDC } from "@/lib/network";

const CrossChainStudio = dynamic(
  () =>
    import("@/components/execute/cross-chain-studio").then((m) => ({
      default: m.CrossChainStudio,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
      </div>
    ),
  },
);

export default function ExecutePage() {
  const { isConnected } = useAccount();
  const { isTestnet } = useNetwork();

  return (
    <AppShell
      title="Execute"
      subtitle="Agora Forge · compare routes · execute in one flow"
    >
      <div className="space-y-6">
        <MarketTicker />
        {!isConnected && isTestnet && (
          <p className="mx-auto max-w-lg rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-100">
            Connect wallet · fund test tokens on Arc + Base Sepolia if needed ·{" "}
            {ARC_FEE_USDC} platform fee per run
          </p>
        )}
        <CrossChainStudio />
      </div>
    </AppShell>
  );
}
