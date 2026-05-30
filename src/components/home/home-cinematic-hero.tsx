"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeExecutionVisual } from "./home-execution-visual";
import { HomeProBackdrop } from "./home-pro-backdrop";
import { figmaEaseOut, figmaSpringSnappy } from "@/design/motion-presets";
import { formatPct, formatUsd } from "@/lib/utils";

export function HomeCinematicHero({
  compact,
  showCta = true,
  walletPreview,
}: {
  compact?: boolean;
  showCta?: boolean;
  walletPreview?: { totalUsd: number; change24hPct: number };
}) {
  return (
    <section
      className={`home-pro-hero relative overflow-hidden ${compact ? "home-pro-hero--compact" : ""}`}
    >
      <HomeProBackdrop />

      <div className="home-pro-hero__inner relative z-10">
        <motion.div
          className="home-pro-hero__copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={figmaEaseOut}
        >
          <p className="home-pro-hero__kicker">Agora Forge · Circle CCTP · Arc</p>

          <h1 className="home-pro-hero__title font-display">
            Cross-chain execution
            <br />
            <span className="home-pro-hero__accent">without compromise.</span>
          </h1>

          <p className="home-pro-hero__lede">
            Route USDC with Circle CCTP, compare LI.FI paths in real time, and settle
            swaps across Ethereum, Base, Arbitrum, and Arc — backed by Zerion and GoldRush
            portfolio intelligence.
          </p>

          {walletPreview && (
            <div className="home-pro-wallet-strip lg:hidden">
              <span className="home-pro-wallet-strip__label">Portfolio</span>
              <span className="home-pro-wallet-strip__value">{formatUsd(walletPreview.totalUsd)}</span>
              <span
                className={
                  walletPreview.change24hPct >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }
              >
                {formatPct(walletPreview.change24hPct)}
              </span>
            </div>
          )}

          {showCta && (
            <div className="home-pro-hero__actions">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }} transition={figmaSpringSnappy}>
                <Link href="/execute" className="home-pro-btn home-pro-btn--primary">
                  Open Execute
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <Link href="/portfolio" className="home-pro-btn home-pro-btn--secondary">
                Portfolio
              </Link>
            </div>
          )}

          <div className="home-pro-hero__metrics">
            <div>
              <p className="home-pro-metric__label">Rails</p>
              <p className="home-pro-metric__value">CCTP · LI.FI · Uniswap</p>
            </div>
            <div>
              <p className="home-pro-metric__label">Data</p>
              <p className="home-pro-metric__value">Zerion · GoldRush · CoinGecko</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="home-pro-hero__visual"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...figmaEaseOut, delay: 0.12 }}
        >
          {walletPreview && (
            <div className="home-pro-wallet-card hidden lg:flex">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Connected portfolio
              </span>
              <p className="font-display mt-2 text-2xl font-semibold tabular-nums text-white">
                {formatUsd(walletPreview.totalUsd)}
              </p>
              <p
                className={`mt-1 text-sm tabular-nums ${
                  walletPreview.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPct(walletPreview.change24hPct)} · 24h
              </p>
            </div>
          )}
          <HomeExecutionVisual compact={compact} />
        </motion.div>
      </div>
    </section>
  );
}
