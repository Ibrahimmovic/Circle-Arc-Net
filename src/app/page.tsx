"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { HomeExecutionVisual } from "@/components/home/home-execution-visual";
import { MotionScrollReveal } from "@/components/motion/motion-primitives";
import { GlassPanel } from "@/components/ui/glass-ui";
import { figmaEaseOut } from "@/design/motion-presets";
import { useAccount } from "wagmi";

export default function HomePage() {
  const { status } = useAccount();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    if (status !== "connecting" && status !== "reconnecting") {
      setWalletReady(true);
    }
  }, [status]);

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
      <div className="home-exec-only mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={figmaEaseOut}
        >
          <HomeExecutionVisual />
        </motion.div>

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
