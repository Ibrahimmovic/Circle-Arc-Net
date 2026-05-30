"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { fadeUpContainer, scaleInItem } from "@/design/motion-presets";
import { GlassIconOrb } from "@/components/ui/glass-ui";

const FEATURES = [
  {
    label: "Execute",
    text: "Quote routes, bridge with CCTP, swap via LI.FI — one professional workflow.",
    href: "/execute",
    icon: "cyan" as const,
    preview: (
      <div className="flex items-center -space-x-2">
        <TokenAvatar symbol="USDC" chainKey="Arc_Testnet" size={32} />
        <TokenAvatar symbol="USDC" chainKey="Base" size={32} />
        <TokenAvatar symbol="ETH" chainKey="Ethereum" size={32} />
      </div>
    ),
  },
  {
    label: "Portfolio",
    text: "Multichain balances, NFTs, transactions, and regime-aware rebalance signals.",
    href: "/portfolio",
    icon: "violet" as const,
    preview: (
      <div className="flex items-center -space-x-2">
        <TokenAvatar symbol="ETH" chainKey="Ethereum" size={32} />
        <TokenAvatar symbol="USDC" chainKey="Arbitrum" size={32} />
        <TokenAvatar symbol="OP" chainKey="Optimism" size={32} />
      </div>
    ),
  },
  {
    label: "Agent",
    text: "Save execution goals and run portfolio-linked CCTP jobs from the console.",
    href: "/agent",
    icon: "coral" as const,
    preview: (
      <div className="flex items-center -space-x-2">
        <TokenAvatar symbol="USDC" chainKey="Base" size={32} />
        <TokenAvatar symbol="USDC" chainKey="Polygon" size={32} />
      </div>
    ),
  },
] as const;

export function HomeFeatureGrid() {
  return (
    <motion.div
      className="home-glass-features"
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {FEATURES.map(({ label, text, href, preview, icon }) => (
        <motion.div key={href} variants={scaleInItem}>
          <Link href={href} className="home-glass-feature glass-panel group block h-full">
            <div className="home-glass-feature__top">
              {preview}
              <GlassIconOrb icon={ArrowRight} variant={icon} size="sm" className="ml-auto opacity-80 transition group-hover:opacity-100" />
            </div>
            <h3 className="home-glass-feature__title">{label}</h3>
            <p className="home-glass-feature__text">{text}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
