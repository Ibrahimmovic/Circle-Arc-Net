"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowRight, Globe, Zap } from "lucide-react";
import {
  fadeUpContainer,
  scaleInItem,
  figmaSpringSnappy,
} from "@/design/motion-presets";

const FEATURES = [
  {
    icon: ArrowLeftRight,
    label: "Swap & Bridge",
    text: "Quote, compare routes, execute in one cinematic flow.",
    href: "/execute",
    accent: "home-feature--cyan",
  },
  {
    icon: Globe,
    label: "Portfolio",
    text: "Multichain net worth, tokens, NFTs, and activity.",
    href: "/portfolio",
    accent: "home-feature--violet",
  },
  {
    icon: Zap,
    label: "Agent",
    text: "Save goals and run portfolio-linked CCTP jobs.",
    href: "/agent",
    accent: "home-feature--emerald",
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
      {FEATURES.map(({ icon: Icon, label, text, href, accent }) => (
        <motion.div key={href} variants={scaleInItem}>
          <Link href={href} className={`home-feature-card ${accent} group block`}>
            <motion.div
              className="home-feature-card__icon"
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
              transition={figmaSpringSnappy}
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </motion.div>
            <p className="home-feature-card__title">{label}</p>
            <p className="home-feature-card__text">{text}</p>
            <span className="home-feature-card__link">
              Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
