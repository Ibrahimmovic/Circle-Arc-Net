"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { PremiumIcon } from "@/components/ui/premium-icon";
import { GlassBadge, GlassIconOrb, GlassPanel } from "@/components/ui/glass-ui";
import { RegimeBadge } from "./regime-badge";
import { formatUsd, formatPct } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";
import { Layers, Globe, TrendingUp } from "lucide-react";

export function PortfolioHero({
  totalUsd,
  change24hPct,
  regime,
  chainCount,
  sparkline,
  portfolioChartSource,
  sources,
  dataSourceLabel,
  loading,
  variant = "glass",
}: {
  totalUsd: number;
  change24hPct: number;
  regime: MarketRegime;
  chainCount: number;
  sparkline: number[];
  portfolioChartSource?: "zerion" | "estimated";
  sources: string[];
  dataSourceLabel?: string;
  loading?: boolean;
  variant?: "classic" | "glass";
}) {
  const up = change24hPct >= 0;
  const chartUp =
    sparkline.length > 1
      ? (sparkline[sparkline.length - 1] ?? 0) >= (sparkline[0] ?? 0)
      : up;

  if (variant === "classic") {
    return (
      <div className="portfolio-hero-premium relative p-5 sm:p-8 lg:p-10">
        <div className="portfolio-hero-premium__mesh" aria-hidden />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-12 left-8 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/90">
              <PremiumIcon icon={TrendingUp} variant="cyan" size="sm" />
              Multichain net worth
            </p>
            <p className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {loading ? "…" : formatUsd(totalUsd)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg px-2.5 py-1 text-base font-semibold ${
                  up
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {formatPct(change24hPct)} 24h
              </span>
              <RegimeBadge regime={regime} />
              <span className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <PremiumIcon icon={Globe} variant="violet" size="sm" />
                {chainCount} chains
              </span>
              <span className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <PremiumIcon icon={Layers} variant="emerald" size="sm" />
                {dataSourceLabel ?? sources.slice(0, 3).join(" · ")}
              </span>
            </div>
          </div>
          {sparkline.length > 1 && (
            <div className="flex flex-col items-end justify-between gap-4">
              <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 px-3 py-2 backdrop-blur-sm">
                <p className="text-[9px] uppercase text-slate-500">
                  {portfolioChartSource === "zerion" ? "Your portfolio" : "Portfolio est."}
                </p>
                <Sparkline
                  data={sparkline.slice(-32)}
                  width={140}
                  height={36}
                  positive={chartUp}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <GlassPanel strong className="portfolio-glass-hero p-5 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            <GlassIconOrb icon={TrendingUp} variant="cyan" size="sm" />
            Multichain net worth
          </p>
          <p className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {loading ? "…" : formatUsd(totalUsd)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <GlassBadge>
              <span className={up ? "text-emerald-200" : "text-rose-200"}>
                {formatPct(change24hPct)} 24h
              </span>
            </GlassBadge>
            <RegimeBadge regime={regime} />
            <GlassBadge>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {chainCount} chains
              </span>
            </GlassBadge>
            <GlassBadge>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                {dataSourceLabel ?? sources.slice(0, 3).join(" · ")}
              </span>
            </GlassBadge>
          </div>
        </div>
        {sparkline.length > 1 && (
          <div className="glass-panel portfolio-glass-sparkline px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/50">
              {portfolioChartSource === "zerion" ? "Your portfolio" : "Portfolio est."}
            </p>
            <Sparkline
              data={sparkline.slice(-32)}
              width={140}
              height={36}
              positive={chartUp}
            />
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
