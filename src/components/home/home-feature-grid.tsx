"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowRight, Globe, Zap } from "lucide-react";
import { NeoGlass } from "@/components/ui/neo-glass";
import {
  fadeUpContainer,
  figmaSpringSnappy,
  scaleInItem,
} from "@/design/motion-presets";

const FEATURES = [
  {
    icon: ArrowLeftRight,
    label: "Swap & Bridge",
    text: "Quote, compare routes, execute in one cinematic flow.",
    href: "/execute",
    glow: "cyan" as const,
  },
  {
    icon: Globe,
    label: "Portfolio",
    text: "Multichain net worth, tokens, NFTs, and activity.",
    href: "/portfolio",
    glow: "violet" as const,
  },
  {
    icon: Zap,
    label: "Agent",
    text: "Save goals and run portfolio-linked CCTP jobs.",
    href: "/agent",
    glow: "indigo" as const,
  },
] as const;

export function HomeFeatureGrid() {
  return (
    <motion.div
      className="home-feature-grid"
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {FEATURES.map(({ icon: Icon, label, text, href, glow }) => (
        <motion.div key={href} variants={scaleInItem}>
          <Link href={href} className="group block h-full">
            <NeoGlass glow={glow} padding="md" className="home-feature-card h-full transition-transform duration-300 group-hover:-translate-y-1">
              <motion.div
                className="home-feature-card__icon"
                whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
                transition={figmaSpringSnappy}
              >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </motion.div>
              <p className="home-feature-card__title">{label}</p>
              <p className="home-feature-card__text">{text}</p>
              <span className="home-feature-card__link">
                Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </NeoGlass>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
