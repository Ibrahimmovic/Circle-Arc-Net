"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { HomeCinematicHero } from "@/components/home/home-cinematic-hero";
import { MotionScrollReveal } from "@/components/motion/motion-primitives";
import { GlassPanel } from "@/components/ui/glass-ui";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAccount } from "wagmi";

export default function HomePage() {
  const { address, isConnected, status } = useAccount();
  const [walletReady, setWalletReady] = useState(false);
  const { data } = useDashboard(isConnected ? address : undefined);

  useEffect(() => {
    if (status !== "connecting" && status !== "reconnecting") {
      setWalletReady(true);
    }
  }, [status]);

  const analysis = data?.analysis;
  const totalUsd = analysis?.totalUsd ?? 0;
  const change24h =
    analysis?.change24hPct ??
    (data?.markets
      ? (data.markets.ethChange24h + data.markets.btcChange24h) / 2
      : 0);

  if (!walletReady) {
    return (
      <AppShell title="Overview" subtitle="" variant="home">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Overview" subtitle="" variant="home">
      <HomeCinematicHero
        compact={isConnected}
        walletPreview={
          isConnected && analysis
            ? { totalUsd, change24hPct: change24h }
            : undefined
        }
      />

      <div className="home-content mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6">
        <MotionScrollReveal>
          <GlassPanel strong className="overflow-hidden">
            <MarketTicker variant="glass" />
            <CoinStrip variant="glass" />
          </GlassPanel>
        </MotionScrollReveal>
      </div>
    </AppShell>
  );
}
