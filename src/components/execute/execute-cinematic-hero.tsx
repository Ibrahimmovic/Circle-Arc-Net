"use client";

import { motion } from "framer-motion";
import { HomeExecutionVisual } from "@/components/home/home-execution-visual";
import { ForgeRailsStrip } from "@/components/execute/forge-rails-strip";
import { figmaEaseOut } from "@/design/motion-presets";
import { GlassPanel, GlassBadge } from "@/components/ui/glass-ui";

/** Execute tab hero — same cinematic glass language as Home, execute-specific copy. */
export function ExecuteCinematicHero() {
  return (
    <section className="home-glass-hero home-glass-hero--compact execute-glass-hero relative overflow-hidden">
      <div className="home-glass-hero__inner relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={figmaEaseOut}
        >
          <GlassPanel strong className="home-glass-hero__copy">
            <div className="home-glass-hero__badges">
              <GlassBadge>Agora Forge</GlassBadge>
              <GlassBadge>Circle CCTP</GlassBadge>
              <GlassBadge>Execution Desk</GlassBadge>
            </div>

            <h1 className="home-glass-hero__title font-display">
              Bridge &amp; swap
              <br />
              <span className="home-glass-hero__accent">across every chain.</span>
            </h1>

            <p className="home-glass-hero__lede">
              Quote Circle CCTP, LI.FI, and Uniswap in one desk — compare paths, tune
              slippage, and execute with live CoinGecko token icons.
            </p>

            <div className="home-glass-hero__metrics">
              <div>
                <p className="home-glass-metric__label">Rails</p>
                <ForgeRailsStrip />
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
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...figmaEaseOut, delay: 0.12 }}
        >
          <HomeExecutionVisual glassIcons />
        </motion.div>
      </div>
    </section>
  );
}
