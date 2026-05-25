"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { RegimeBadge } from "./regime-badge";
import { formatUsd, formatPct } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";
import { Layers, Globe } from "lucide-react";

export function PortfolioHero({
  totalUsd,
  change24hPct,
  regime,
  chainCount,
  sparkline,
  sources,
  loading,
}: {
  totalUsd: number;
  change24hPct: number;
  regime: MarketRegime;
  chainCount: number;
  sparkline: number[];
  sources: string[];
  loading?: boolean;
}) {
  const up = change24hPct >= 0;

  return (
    <div className="luxury-hero relative overflow-hidden rounded-3xl p-8 lg:p-10">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/90">
            Multichain net worth
          </p>
          <p className="font-display mt-2 text-4xl font-bold text-white lg:text-5xl">
            {loading ? "…" : formatUsd(totalUsd)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span
              className={`text-lg font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}
            >
              {formatPct(change24hPct)} 24h
            </span>
            <RegimeBadge regime={regime} />
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              {chainCount} chains
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-violet-400" />
              Live · {sources.slice(0, 2).join(" + ")}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between gap-4">
          {sparkline.length > 4 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 px-2 py-1.5">
              <p className="text-[9px] uppercase text-slate-500">ETH macro</p>
              <Sparkline data={sparkline} width={120} height={32} positive={up} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
