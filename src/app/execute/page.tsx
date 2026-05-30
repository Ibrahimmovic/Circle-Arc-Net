"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { GlassPanel } from "@/components/ui/glass-ui";
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      </div>
    ),
  },
);

export default function ExecutePage() {
  const { isConnected } = useAccount();
  const { isTestnet } = useNetwork();

  return (
    <AppShell title="Execution Desk" subtitle="" variant="execute">
      <div className="execute-glass-context home-content mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6">
        {!isConnected && isTestnet && (
          <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-100 backdrop-blur-md">
            Connect wallet · fund test tokens on Arc + Base Sepolia if needed ·{" "}
            {ARC_FEE_USDC} platform fee per run
          </p>
        )}

        <CrossChainStudio />

        <GlassPanel strong className="overflow-hidden">
          <MarketTicker variant="glass" />
          <CoinStrip variant="glass" />
        </GlassPanel>
      </div>
    </AppShell>
  );
}
