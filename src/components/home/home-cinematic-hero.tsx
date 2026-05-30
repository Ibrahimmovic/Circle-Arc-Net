"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeFramerScene } from "./home-framer-scene";
import {
  fadeUpContainer,
  fadeUpItem,
  figmaSpringSnappy,
  heroStagger,
} from "@/design/motion-presets";
import { MotionParallax } from "@/components/motion/motion-primitives";

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
    <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} transition={figmaSpringSnappy}>
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
}: {
  compact?: boolean;
  showCta?: boolean;
}) {
  return (
    <section
      className={`home-cinematic-hero relative overflow-hidden ${compact ? "home-cinematic-hero--compact" : ""}`}
    >
      <MotionParallax offset={compact ? 40 : 72}>
        <HomeFramerScene compact={compact} />
      </MotionParallax>

      <div className="home-cinematic-hero__vignette" aria-hidden />
      <div className="home-cinematic-hero__scanline" aria-hidden />

      <motion.div
        className="home-cinematic-hero__content relative z-10 flex min-h-[inherit] flex-col justify-end pb-8 pt-28 sm:pb-10 sm:pt-32 lg:pb-14"
        variants={fadeUpContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div className="home-cinematic-hero__badge" variants={fadeUpItem}>
          <motion.span
            className="home-cinematic-hero__badge-dot"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...figmaSpringSnappy, delay: 0.15 + i * heroStagger }}
            >
              {i === 1 ? (
                <span className="home-cinematic-hero__gradient">{line}</span>
              ) : (
                line
              )}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p className="home-cinematic-hero__sub max-w-xl" variants={fadeUpItem}>
          Bridge USDC, swap across chains, and run full execution routes — live
          portfolio intelligence powered by Circle, LI.FI, and multichain data.
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
          className="home-cinematic-hero__rails mt-10 hidden flex-wrap gap-2 sm:flex"
          variants={fadeUpItem}
        >
          {["CCTP", "LI.FI", "Uniswap", "Zerion", "GoldRush"].map((rail, i) => (
            <motion.span
              key={rail}
              className="home-rail-chip"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...figmaSpringSnappy, delay: 0.5 + i * 0.06 }}
              whileHover={{ scale: 1.05, borderColor: "rgba(129,140,248,0.5)" }}
            >
              {rail}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
