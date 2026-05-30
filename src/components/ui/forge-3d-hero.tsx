"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

function Coin3D({
  symbol,
  gradient,
  delay = 0,
  x = 0,
}: {
  symbol: string;
  gradient: string;
  delay?: number;
  x?: number;
}) {
  return (
    <motion.div
      className="forge-coin-3d"
      style={
        {
          "--coin-gradient": gradient,
          marginLeft: x,
        } as React.CSSProperties
      }
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: [0, -10, 0],
        rotateY: [0, 18, 0, -18, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
        rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <div className="forge-coin-3d__edge" aria-hidden />
      <div className="forge-coin-3d__face">
        <span>{symbol}</span>
      </div>
    </motion.div>
  );
}

function BridgeBeam() {
  return (
    <div className="forge-bridge-beam" aria-hidden>
      <svg viewBox="0 0 200 40" className="h-10 w-full max-w-[12rem]">
        <defs>
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M8 20 Q100 2 192 20"
          fill="none"
          stroke="url(#beam-grad)"
          strokeWidth="2"
          strokeDasharray="6 8"
          className="forge-bridge-beam__path"
        />
      </svg>
      <motion.span
        className="forge-bridge-beam__orb"
        animate={{ x: ["-10%", "110%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function GlassCube({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0], rotateX: [0, 8, 0], rotateY: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="forge-glass-cube">
        <div className="forge-glass-cube__inner" />
      </div>
    </motion.div>
  );
}

export function Forge3DHero({
  compact,
  showCta = true,
}: {
  compact?: boolean;
  showCta?: boolean;
}) {
  return (
    <section
      className={`premium-hero relative overflow-hidden ${compact ? "premium-hero--compact" : ""}`}
    >
      <div className="premium-hero__aurora" aria-hidden />
      <div className="premium-hero__grid" aria-hidden />

      <GlassCube className="absolute left-[8%] top-[18%] hidden opacity-60 sm:block" />
      <GlassCube className="absolute right-[12%] top-[28%] hidden scale-75 opacity-40 md:block" />
      <GlassCube className="absolute bottom-[20%] right-[22%] hidden scale-50 opacity-30 lg:block" />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
        <div className={compact ? "max-w-xl" : "max-w-2xl"}>
          <motion.p
            className="premium-hero__eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="inline h-3.5 w-3.5 text-cyan-400" /> Agora Forge
          </motion.p>
          <motion.h2
            className="font-display mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Cross-chain execution,{" "}
            <span className="text-gradient">reimagined</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Bridge USDC with Circle CCTP, swap across chains, and run full execution
            routes — live portfolio intelligence on Arc, Base, Ethereum, and beyond.
          </motion.p>

          {showCta && (
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Link href="/execute" className="premium-cta premium-cta--primary">
                Launch Execute
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/portfolio" className="premium-cta premium-cta--ghost">
                View Portfolio
              </Link>
            </motion.div>
          )}
        </div>

        <div className="forge-scene-3d mx-auto w-full max-w-md lg:max-w-none">
          <div className="forge-scene-3d__stage">
            <Coin3D
              symbol="USDC"
              gradient="linear-gradient(145deg, #0ea5e9, #0369a1)"
              x={-8}
            />
            <div className="flex flex-col items-center px-2">
              <BridgeBeam />
              <motion.span
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                CCTP · LI.FI
              </motion.span>
            </div>
            <Coin3D
              symbol="ETH"
              gradient="linear-gradient(145deg, #8b5cf6, #4c1d95)"
              delay={0.2}
              x={8}
            />
          </div>
          <motion.div
            className="forge-scene-3d__platform"
            animate={{ rotateX: [62, 58, 62] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
}
