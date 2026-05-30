"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { fadeUpContainer, scaleInItem } from "@/design/motion-presets";

const FEATURES = [
  {
    label: "Execute",
    text: "Quote routes, bridge with CCTP, swap via LI.FI — one professional workflow.",
    href: "/execute",
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
      className="home-pro-features"
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {FEATURES.map(({ label, text, href, preview }) => (
        <motion.div key={href} variants={scaleInItem}>
          <Link href={href} className="home-pro-feature group block h-full">
            <div className="home-pro-feature__top">
              {preview}
              <ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
            </div>
            <h3 className="home-pro-feature__title">{label}</h3>
            <p className="home-pro-feature__text">{text}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
