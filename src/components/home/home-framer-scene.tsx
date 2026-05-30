"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { figmaSpringSoft } from "@/design/motion-presets";

function AuroraBlob({
  className,
  animate,
}: {
  className?: string;
  animate: { x?: number[]; y?: number[]; scale?: number[] };
}) {
  return (
    <motion.div
      className={className}
      animate={animate}
      transition={{ duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      aria-hidden
    />
  );
}

function FloatingGlassCube({
  className,
  delay,
  size = "md",
}: {
  className?: string;
  delay: number;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <motion.div
      className={cn(
        "neo-glass-cube",
        size === "sm" && "neo-glass-cube--sm",
        size === "lg" && "neo-glass-cube--lg",
        className,
      )}
      animate={{
        y: [0, -16, 0],
        rotateX: [0, 12, 0],
        rotateY: [0, -18, 0],
      }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      aria-hidden
    >
      <div className="neo-glass-cube__wire" />
    </motion.div>
  );
}

function FramerCoin({
  symbol,
  gradient,
  edge,
  rim,
  delay = 0,
  className,
}: {
  symbol: string;
  gradient: string;
  edge: string;
  rim: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("framer-coin-3d", className)}
      style={
        {
          "--coin-face": gradient,
          "--coin-edge": edge,
          "--coin-rim": rim,
        } as React.CSSProperties
      }
      initial={{ opacity: 0, scale: 0.5, rotateY: -50 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotateY: [0, 360],
        y: [0, -18, 0],
      }}
      transition={{
        opacity: { duration: 0.9, delay },
        scale: { ...figmaSpringSoft, delay },
        rotateY: { duration: 11, repeat: Infinity, ease: "linear", delay },
        y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.15 },
      }}
    >
      <div className="framer-coin-3d__rim" />
      <div className="framer-coin-3d__edge" />
      <div className="framer-coin-3d__face">
        <span>{symbol}</span>
      </div>
      <motion.div
        className="framer-coin-3d__glow"
        animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.2, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </motion.div>
  );
}

function SwapHub() {
  return (
    <motion.div
      className="framer-swap-hub"
      animate={{
        boxShadow: [
          "0 0 24px rgba(255,255,255,0.12)",
          "0 0 52px rgba(129,140,248,0.5)",
          "0 0 24px rgba(255,255,255,0.12)",
        ],
      }}
      transition={{ duration: 2.5, repeat: Infinity }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M7 16V4M7 4L3 8M7 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}

function MetallicPath({ compact }: { compact?: boolean }) {
  return (
    <motion.svg
      className="framer-metal-path"
      viewBox="0 0 800 120"
      preserveAspectRatio="none"
      animate={{ opacity: [0.65, 1, 0.65] }}
      transition={{ duration: 4, repeat: Infinity }}
      aria-hidden
    >
      <defs>
        <linearGradient id="metal-top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0" />
          <stop offset="20%" stopColor="#4c4a6a" />
          <stop offset="50%" stopColor="#8b8ba8" />
          <stop offset="80%" stopColor="#4c4a6a" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="metal-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>
      <path
        d={
          compact
            ? "M0,70 C150,30 300,90 400,55 S650,25 800,65 L800,95 C650,55 400,85 200,75 S50,95 0,85 Z"
            : "M0,75 C180,25 360,95 400,50 S620,15 800,60 L800,100 C620,60 400,90 200,80 S40,100 0,90 Z"
        }
        fill="url(#metal-face)"
        opacity="0.85"
      />
      <path
        d={
          compact
            ? "M0,68 C150,28 300,88 400,53 S650,23 800,63"
            : "M0,73 C180,23 360,93 400,48 S620,13 800,58"
        }
        fill="none"
        stroke="url(#metal-top)"
        strokeWidth="2"
      />
    </motion.svg>
  );
}

function BridgeArc() {
  return (
    <div className="framer-bridge relative flex w-full max-w-[9rem] flex-col items-center">
      <svg viewBox="0 0 200 32" className="h-6 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="framer-bridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <motion.path
          d="M8 20 Q100 6 192 20"
          fill="none"
          stroke="url(#framer-bridge-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 8"
          animate={{ strokeDashoffset: [0, -26], opacity: [0.5, 1, 0.5] }}
          transition={{
            strokeDashoffset: { duration: 2.2, repeat: Infinity, ease: "linear" },
            opacity: { duration: 2, repeat: Infinity },
          }}
        />
      </svg>
      <motion.p
        className="text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-200/70"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        CCTP · LI.FI
      </motion.p>
    </div>
  );
}

function CrystalShard({ className, delay }: { className?: string; delay: number }) {
  return (
    <motion.div
      className={cn("framer-crystal", className)}
      animate={{ rotate: [0, 8, -6, 0], opacity: [0.12, 0.32, 0.12] }}
      transition={{ duration: 8, repeat: Infinity, delay }}
      aria-hidden
    />
  );
}

export function HomeFramerScene({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("framer-scene absolute inset-0", compact && "framer-scene--compact")} aria-hidden>
      <div className="framer-scene__spotlight" />

      <AuroraBlob
        className="framer-aurora framer-aurora--indigo"
        animate={{ x: [0, 40, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }}
      />
      <AuroraBlob
        className="framer-aurora framer-aurora--cyan"
        animate={{ x: [0, -32, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
      />
      <AuroraBlob
        className="framer-aurora framer-aurora--purple"
        animate={{ x: [0, 16, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
      />

      <motion.div
        className="framer-scene__grid-perspective"
        animate={{ backgroundPosition: ["0px 0px", "0px 48px"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <FloatingGlassCube className="left-[6%] top-[22%]" delay={0} size="md" />
      <FloatingGlassCube className="right-[8%] top-[18%]" delay={0.8} size="sm" />
      <FloatingGlassCube className="right-[18%] bottom-[28%]" delay={1.4} size="lg" />
      <FloatingGlassCube className="left-[14%] bottom-[32%]" delay={2} size="sm" />

      <CrystalShard className="left-[42%] top-[12%]" delay={0} />
      <CrystalShard className="right-[30%] top-[20%] rotate-45" delay={1.2} />

      <div className="framer-scene__stage">
        <MetallicPath compact={compact} />

        <div className="framer-scene__coins">
          <FramerCoin
            symbol="USDC"
            gradient="linear-gradient(155deg, #7dd3fc 0%, #0284c7 55%, #0369a1 100%)"
            edge="#0c4a6e"
            rim="rgba(56, 189, 248, 0.9)"
            delay={0}
          />
          <div className="flex flex-col items-center gap-2">
            <SwapHub />
            <BridgeArc />
          </div>
          <FramerCoin
            symbol="ETH"
            gradient="linear-gradient(155deg, #ddd6fe 0%, #7c3aed 50%, #5b21b6 100%)"
            edge="#4c1d95"
            rim="rgba(167, 139, 250, 0.95)"
            delay={0.2}
          />
        </div>

        {!compact && (
          <FramerCoin
            symbol="BTC"
            className="framer-coin-3d--accent absolute -bottom-2 left-1/2 z-0 -translate-x-1/2 scale-[0.68] opacity-80"
            gradient="linear-gradient(155deg, #fcd34d 0%, #f59e0b 50%, #b45309 100%)"
            edge="#78350f"
            rim="rgba(251, 191, 36, 0.8)"
            delay={0.4}
          />
        )}
      </div>

      {[...Array(compact ? 16 : 32)].map((_, i) => (
        <motion.span
          key={i}
          className="framer-particle"
          style={{
            left: `${6 + ((i * 13) % 88)}%`,
            top: `${8 + ((i * 19) % 75)}%`,
          }}
          animate={{
            y: [0, -24 - (i % 6) * 6, 0],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: 3.5 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}
