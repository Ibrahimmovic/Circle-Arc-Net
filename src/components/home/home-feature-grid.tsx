"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Bot } from "lucide-react";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { fadeUpContainer, scaleInItem } from "@/design/motion-presets";
import { GlassIconOrb, GlassPanel, LiquidGlassTokenOrb } from "@/components/ui/glass-ui";
import type { LucideIcon } from "lucide-react";

const TOKEN_VARIANTS = ["cyan", "violet", "coral", "emerald"] as const;

const FEATURES = [
  {
    label: "Execute",
    text: "Quote routes, bridge with CCTP, swap via LI.FI — one professional workflow.",
    href: "/execute",
    icon: Zap,
    orb: "cyan" as const,
    tokens: [
      { symbol: "USDC", chainKey: "Arc_Testnet" },
      { symbol: "USDC", chainKey: "Base" },
      { symbol: "ETH", chainKey: "Ethereum" },
    ],
  },
  {
    label: "Portfolio",
    text: "Multichain balances, NFTs, transactions, and regime-aware rebalance signals.",
    href: "/portfolio",
    icon: BarChart3,
    orb: "violet" as const,
    tokens: [
      { symbol: "ETH", chainKey: "Ethereum" },
      { symbol: "USDC", chainKey: "Arbitrum" },
      { symbol: "OP", chainKey: "Optimism" },
    ],
  },
  {
    label: "Agent",
    text: "Save execution goals and run portfolio-linked CCTP jobs from the console.",
    href: "/agent",
    icon: Bot,
    orb: "coral" as const,
    tokens: [
      { symbol: "USDC", chainKey: "Base" },
      { symbol: "USDC", chainKey: "Polygon" },
    ],
  },
] as const;

function LiquidTokenStack({
  tokens,
  baseVariant,
}: {
  tokens: readonly { symbol: string; chainKey: string }[];
  baseVariant: (typeof TOKEN_VARIANTS)[number];
}) {
  return (
    <div className="flex items-center -space-x-3">
      {tokens.map(({ symbol, chainKey }, i) => {
        const variant = TOKEN_VARIANTS[(TOKEN_VARIANTS.indexOf(baseVariant) + i) % TOKEN_VARIANTS.length];
        return (
          <LiquidGlassTokenOrb key={`${symbol}-${chainKey}`} variant={variant} size={44}>
            <TokenAvatar symbol={symbol} chainKey={chainKey} size={36} />
          </LiquidGlassTokenOrb>
        );
      })}
    </div>
  );
}

export function HomeFeatureGrid() {
  return (
    <motion.div
      className="home-glass-features"
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {FEATURES.map(({ label, text, href, tokens, orb, icon: FeatureIcon }) => (
        <motion.div key={href} variants={scaleInItem}>
          <GlassPanel strong className="home-glass-feature group h-full">
            <Link href={href} className="block h-full p-5">
              <div className="home-glass-feature__top">
                <LiquidTokenStack tokens={tokens} baseVariant={orb} />
                <GlassIconOrb
                  icon={ArrowRight}
                  variant={orb}
                  size="md"
                  className="ml-auto shrink-0 opacity-90 transition group-hover:opacity-100 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <GlassIconOrb icon={FeatureIcon as LucideIcon} variant={orb} size="sm" />
                <h3 className="home-glass-feature__title">{label}</h3>
              </div>
              <p className="home-glass-feature__text">{text}</p>
            </Link>
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  );
}
