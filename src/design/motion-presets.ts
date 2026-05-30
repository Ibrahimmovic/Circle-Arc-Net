/**
 * Framer Motion presets — tuned to match Figma Smart Animate / Framer spring defaults.
 */
import type { Transition, Variants } from "framer-motion";

export const figmaSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

export const figmaSpringSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 1,
};

export const figmaSpringSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.7,
};

/** Figma ease-out curve (approx. ease-out-expo) */
export const figmaEaseOut: Transition = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};

export const heroStagger = 0.11;

export const fadeUpContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: heroStagger, delayChildren: 0.05 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: figmaSpring,
  },
};

export const scaleInItem: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: figmaSpringSoft,
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  show: { opacity: 1, x: 0, transition: figmaSpring },
};

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...figmaSpring, delay: 0.05 },
  },
};

export const hoverLift = {
  scale: 1.02,
  y: -4,
  transition: figmaSpringSnappy,
};

export const tapPress = { scale: 0.98, transition: figmaSpringSnappy };
