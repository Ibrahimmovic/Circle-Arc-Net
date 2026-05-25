"use client";

import { motion } from "framer-motion";

export function HeroOrbit() {
  return (
    <div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56">
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-violet-500/25"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-600/20 backdrop-blur-sm"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-gradient">USDC</span>
      </div>
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.span
          key={deg}
          className="absolute h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
          style={{
            top: "50%",
            left: "50%",
            marginTop: -4,
            marginLeft: -4,
            transform: `rotate(${deg}deg) translateY(-90px)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
