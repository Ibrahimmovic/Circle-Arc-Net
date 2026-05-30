"use client";

import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Globe, Zap } from "lucide-react";

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
    <div className="home-feature-grid">
      {FEATURES.map(({ icon: Icon, label, text, href, accent }) => (
        <Link key={href} href={href} className={`home-feature-card ${accent} group`}>
          <div className="home-feature-card__icon">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <p className="home-feature-card__title">{label}</p>
          <p className="home-feature-card__text">{text}</p>
          <span className="home-feature-card__link">
            Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
