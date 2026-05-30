"use client";

import { motion } from "framer-motion";

const CLOUD_LAYERS = [
  {
    className: "cinematic-cloud cinematic-cloud--coral-1",
    animate: { x: [0, 60, 0], y: [0, -30, 0], scale: [1, 1.06, 1] },
    duration: 52,
  },
  {
    className: "cinematic-cloud cinematic-cloud--coral-2",
    animate: { x: [0, -50, 0], y: [0, 25, 0], scale: [1, 1.04, 1] },
    duration: 44,
  },
  {
    className: "cinematic-cloud cinematic-cloud--amber",
    animate: { x: [0, 35, 0], y: [0, -18, 0] },
    duration: 38,
  },
  {
    className: "cinematic-cloud cinematic-cloud--slate",
    animate: { x: [0, -40, 0], y: [0, 20, 0] },
    duration: 58,
  },
  {
    className: "cinematic-cloud cinematic-cloud--violet",
    animate: { x: [0, 25, 0], y: [0, -12, 0] },
    duration: 48,
  },
];

/** Theme 1 — moody sky + drifting clouds for cinematic glassmorphism shells. */
export function CinematicCloudBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`cinematic-sky ${className}`} aria-hidden>
      <div className="cinematic-sky__base" />
      {CLOUD_LAYERS.map(({ className: cloudClass, animate, duration }, i) => (
        <motion.div
          key={cloudClass}
          className={cloudClass}
          animate={animate}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 2.5,
          }}
        />
      ))}
      <motion.div
        className="cinematic-sky__haze"
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="cinematic-sky__vignette" />
      <div className="cinematic-sky__cryptic" />
      <div className="cinematic-sky__grain" />
    </div>
  );
}
