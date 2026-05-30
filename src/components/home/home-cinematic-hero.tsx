"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeFramerScene } from "./home-framer-scene";
import { NeoGlass } from "@/components/ui/neo-glass";
import {
  fadeUpContainer,
  fadeUpItem,
  figmaSpringSnappy,
  heroStagger,
} from "@/design/motion-presets";
import { MotionParallax } from "@/components/motion/motion-primitives";
import { formatPct, formatUsd } from "@/lib/utils";

function MotionCta({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "ghost";
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={figmaSpringSnappy}
    >
      <Link
        href={href}
        className={`home-btn ${variant === "primary" ? "home-btn--primary" : "home-btn--ghost"}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

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
      className={`home-cinematic-hero relative overflow-hidden ${compact ? "home-cinematic-hero--compact" : ""}`}
    >
      <MotionParallax offset={compact ? 36 : 80}>
        <HomeFramerScene compact={compact} />
      </MotionParallax>

      <div className="home-cinematic-hero__vignette" aria-hidden />
      <div className="home-cinematic-hero__scanline" aria-hidden />

      <div className="home-cinematic-hero__layout relative z-10 min-h-[inherit]">
        {walletPreview && (
          <motion.div
            className="home-hero-wallet hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...figmaSpringSnappy, delay: 0.3 }}
          >
            <NeoGlass glow="cyan" padding="md" className="home-hero-wallet__card">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
                / Wallet
              </p>
              <p className="font-display mt-2 text-3xl font-bold text-white">
                {formatUsd(walletPreview.totalUsd)}
              </p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  walletPreview.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPct(walletPreview.change24hPct)} 24h
              </p>
            </NeoGlass>
          </motion.div>
        )}

        <motion.div
          className="home-cinematic-hero__content flex min-h-[inherit] flex-col justify-end pb-8 pt-24 sm:pb-10 sm:pt-28 lg:pb-14"
          variants={fadeUpContainer}
          initial="hidden"
          animate="show"
        >
          <NeoGlass glow="indigo" padding="lg" className="home-hero-glass max-w-2xl">
            <motion.div className="home-cinematic-hero__badge !mb-4 !mt-0" variants={fadeUpItem}>
              <motion.span
                className="home-cinematic-hero__badge-dot"
                animate={{ scale: [1, 1.25, 1], opacity: [1, 0.55, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              Agora Forge · Circle CCTP · Arc
            </motion.div>

            <motion.h1 className="home-cinematic-hero__title font-display" variants={fadeUpItem}>
              <span className="home-cinematic-hero__slash">/</span>
              {["Cross-chain", "execution", "without limits"].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...figmaSpringSnappy, delay: 0.12 + i * heroStagger }}
                >
                  {i === 1 ? (
                    <span className="home-cinematic-hero__gradient">{line}</span>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p className="home-cinematic-hero__sub" variants={fadeUpItem}>
              Bridge USDC, swap across chains, and run full execution routes — live portfolio
              intelligence powered by Circle, LI.FI, and multichain data.
            </motion.p>

            {showCta && (
              <motion.div className="mt-8 flex flex-wrap gap-3" variants={fadeUpItem}>
                <MotionCta href="/execute" variant="primary">
                  Launch Execute
                  <ArrowRight className="h-4 w-4" />
                </MotionCta>
                <MotionCta href="/portfolio" variant="ghost">
                  Open Portfolio
                </MotionCta>
              </motion.div>
            )}

            <motion.div
              className="mt-8 flex flex-wrap gap-2"
              variants={fadeUpItem}
            >
              {["CCTP", "LI.FI", "Uniswap", "Zerion", "GoldRush"].map((rail, i) => (
                <motion.span
                  key={rail}
                  className="home-rail-chip"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...figmaSpringSnappy, delay: 0.45 + i * 0.05 }}
                  whileHover={{ scale: 1.06, borderColor: "rgba(165,180,252,0.55)" }}
                >
                  {rail}
                </motion.span>
              ))}
            </motion.div>
          </NeoGlass>
        </motion.div>
      </div>
    </section>
  );
}
