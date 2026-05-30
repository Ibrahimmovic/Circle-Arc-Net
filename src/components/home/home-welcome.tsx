"use client";

import Link from "next/link";
import { ArrowRight, Zap, BarChart3 } from "lucide-react";

/** Simple home landing — Execute + Portfolio CTAs (no cinematic/glass hero). */
export function HomeWelcome() {
  return (
    <div className="portfolio-hero-premium relative p-8 sm:p-10 lg:p-12">
      <div className="portfolio-hero-premium__mesh" aria-hidden />
      <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Agora Forge · Circle CCTP · Arc
      </p>
      <h1 className="relative font-display mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
        Cross-chain execution
        <br />
        <span className="text-gradient">without compromise.</span>
      </h1>
      <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
        Bridge USDC with Circle CCTP, compare LI.FI routes, and track multichain
        portfolio data from Zerion and GoldRush.
      </p>
      <div className="relative mt-8 flex flex-wrap gap-3">
        <Link
          href="/execute"
          className="premium-cta premium-cta--primary inline-flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Open Execute
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/portfolio"
          className="premium-cta premium-cta--ghost inline-flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Portfolio
        </Link>
      </div>
    </div>
  );
}
