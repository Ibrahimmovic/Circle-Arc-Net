"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3 } from "lucide-react";
import { HomeExecutionVisual } from "./home-execution-visual";
import { figmaEaseOut } from "@/design/motion-presets";
import { formatPct, formatUsd } from "@/lib/utils";
import { GlassPanel, GlassBadge, LiquidGlassButton } from "@/components/ui/glass-ui";

export function HomeCinematicHero({
  compact,
  walletPreview,
}: {
  compact?: boolean;
  walletPreview?: { totalUsd: number; change24hPct: number };
}) {
  return (
    <section
      className={`home-glass-hero relative overflow-hidden ${compact ? "home-glass-hero--compact" : ""}`}
    >
      <div className="home-glass-hero__inner relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={figmaEaseOut}
        >
          <GlassPanel strong className="home-glass-hero__copy">
            <div className="home-glass-hero__badges">
              <GlassBadge>Agora Forge</GlassBadge>
              <GlassBadge>Circle CCTP</GlassBadge>
              <GlassBadge>Arc</GlassBadge>
            </div>

            <h1 className="home-glass-hero__title font-display">
              Cross-chain execution
              <br />
              <span className="home-glass-hero__accent">without compromise.</span>
            </h1>

            <p className="home-glass-hero__lede">
              Route USDC with Circle CCTP, compare LI.FI paths in real time, and settle
              swaps across Ethereum, Base, Arbitrum, and Arc — backed by Zerion and
              Covalent portfolio intelligence.
            </p>

            {walletPreview && (
              <div className="home-glass-wallet-strip">
                <span className="home-glass-wallet-strip__label">Portfolio</span>
                <span className="home-glass-wallet-strip__value">
                  {formatUsd(walletPreview.totalUsd)}
                </span>
                <span
                  className={
                    walletPreview.change24hPct >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {formatPct(walletPreview.change24hPct)}
                </span>
              </div>
            )}

            <div className="home-glass-hero__actions">
              <LiquidGlassButton href="/execute" variant="primary">
                <Zap className="h-4 w-4" />
                Execution
                <ArrowRight className="h-4 w-4" />
              </LiquidGlassButton>
              <LiquidGlassButton href="/portfolio" variant="secondary">
                <BarChart3 className="h-4 w-4" />
                Portfolio
              </LiquidGlassButton>
            </div>

            <div className="home-glass-hero__metrics">
              <div>
                <p className="home-glass-metric__label">Rails</p>
                <p className="home-glass-metric__value">CCTP · LI.FI · Uniswap</p>
              </div>
              <div>
                <p className="home-glass-metric__label">Data</p>
                <p className="home-glass-metric__value">Zerion · Covalent · CoinGecko</p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          className="home-glass-hero__visual"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...figmaEaseOut, delay: 0.14 }}
        >
          <HomeExecutionVisual />
        </motion.div>
      </div>
    </section>
  );
}
