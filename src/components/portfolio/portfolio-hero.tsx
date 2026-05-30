"use client";

import { Sparkline } from "@/components/ui/sparkline";
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
}) {
  const up = change24hPct >= 0;
  const chartUp =
    sparkline.length > 1
      ? (sparkline[sparkline.length - 1] ?? 0) >= (sparkline[0] ?? 0)
      : up;

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
