"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSceneCanvas } from "./home-scene-canvas";

export function HomeCinematicHero({
  compact,
  showCta = true,
}: {
  compact?: boolean;
  showCta?: boolean;
}) {
  return (
    <section
      className={`home-cinematic-hero relative overflow-hidden ${compact ? "home-cinematic-hero--compact" : ""}`}
    >
      <HomeSceneCanvas compact={compact} />

      <div className="home-cinematic-hero__vignette" aria-hidden />
      <div className="home-cinematic-hero__scanline" aria-hidden />

      <div className="home-cinematic-hero__content relative z-10 flex min-h-[inherit] flex-col justify-end pb-8 pt-28 sm:pb-10 sm:pt-32 lg:pb-14">
        <motion.div
          className="home-cinematic-hero__badge"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="home-cinematic-hero__badge-dot" />
          Agora Forge · Circle CCTP · Arc
        </motion.div>

        <motion.h1
          className="home-cinematic-hero__title font-display"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
        >
          <span className="home-cinematic-hero__slash">/</span>
          Cross-chain
          <br />
          <span className="home-cinematic-hero__gradient">execution</span>
          <br />
          without limits
        </motion.h1>

        <motion.p
          className="home-cinematic-hero__sub max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
        >
          Bridge USDC, swap across chains, and run full execution routes — live
          portfolio intelligence powered by Circle, LI.FI, and multichain data.
        </motion.p>

        {showCta && (
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
          >
            <Link href="/execute" className="home-btn home-btn--primary">
              Launch Execute
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/portfolio" className="home-btn home-btn--ghost">
              Open Portfolio
            </Link>
          </motion.div>
        )}

        <motion.div
          className="home-cinematic-hero__rails mt-10 hidden flex-wrap gap-2 sm:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {["CCTP", "LI.FI", "Uniswap", "Zerion", "GoldRush"].map((rail) => (
            <span key={rail} className="home-rail-chip">
              {rail}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
