"use client";

import { motion } from "framer-motion";
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

function FramerCoin({
  symbol,
  gradient,
  edge,
  className,
  delay = 0,
}: {
  symbol: string;
  gradient: string;
  edge: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`framer-coin-3d ${className ?? ""}`}
      style={
        {
          "--coin-face": gradient,
          "--coin-edge": edge,
        } as React.CSSProperties
      }
      initial={{ opacity: 0, scale: 0.6, rotateY: -40 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotateY: [0, 360],
        y: [0, -14, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        scale: { ...figmaSpringSoft, delay },
        rotateY: { duration: 10, repeat: Infinity, ease: "linear", delay },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.2 },
      }}
    >
      <div className="framer-coin-3d__edge" />
      <div className="framer-coin-3d__face">
        <span>{symbol}</span>
      </div>
      <motion.div
        className="framer-coin-3d__glow"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.15, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </motion.div>
  );
}

function BridgeArc() {
  return (
    <div className="framer-bridge relative flex w-full max-w-[11rem] flex-col items-center">
      <svg viewBox="0 0 200 48" className="h-12 w-full overflow-visible">
        <defs>
          <linearGradient id="framer-bridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--figma-accent-indigo)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--figma-accent-indigo-light)" />
            <stop offset="100%" stopColor="var(--figma-accent-cyan)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.path
          d="M12 32 Q100 4 188 32"
          fill="none"
          stroke="url(#framer-bridge-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -32] }}
          transition={{
            pathLength: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.6 },
            strokeDashoffset: { duration: 2.5, repeat: Infinity, ease: "linear" },
          }}
        />
      </svg>
      <motion.span
        className="framer-bridge__orb"
        animate={{ x: ["-120%", "120%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300/80"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        CCTP · LI.FI
      </motion.p>
    </div>
  );
}

function OrbitRing({ size, duration, reverse }: { size: number; duration: number; reverse?: boolean }) {
  return (
    <motion.div
      className="framer-orbit-ring pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-indigo-400/20"
      style={{
        width: size,
        height: size * 0.38,
        marginLeft: -size / 2,
        marginTop: -(size * 0.38) / 2,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      aria-hidden
    />
  );
}

export function HomeFramerScene({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`framer-scene absolute inset-0 ${compact ? "framer-scene--compact" : ""}`}
      aria-hidden
    >
      <AuroraBlob
        className="framer-aurora framer-aurora--indigo"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
      />
      <AuroraBlob
        className="framer-aurora framer-aurora--cyan"
        animate={{ x: [0, -24, 0], y: [0, 16, 0], scale: [1, 1.05, 1] }}
      />

      <motion.div
        className="framer-scene__grid"
        animate={{ backgroundPosition: ["0px 0px", "0px 40px"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="framer-scene__stage">
        <OrbitRing size={compact ? 220 : 320} duration={28} />
        <OrbitRing size={compact ? 160 : 240} duration={20} reverse />

        <div className="framer-scene__coins">
          <FramerCoin
            symbol="USDC"
            gradient="linear-gradient(145deg, #38bdf8, #0284c7)"
            edge="#0c4a6e"
            delay={0}
          />
          <BridgeArc />
          <FramerCoin
            symbol="ETH"
            gradient="linear-gradient(145deg, #c4b5fd, #7c3aed)"
            edge="#4c1d95"
            delay={0.15}
          />
        </div>

        <motion.div
          className="framer-scene__platform"
          animate={{ rotateX: [58, 62, 58], opacity: [0.6, 0.85, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {[...Array(compact ? 12 : 24)].map((_, i) => (
        <motion.span
          key={i}
          className="framer-particle"
          style={{
            left: `${8 + ((i * 17) % 84)}%`,
            top: `${12 + ((i * 23) % 70)}%`,
          }}
          animate={{
            y: [0, -20 - (i % 5) * 8, 0],
            opacity: [0.15, 0.55, 0.15],
          }}
          transition={{
            duration: 4 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </div>
  );
}
