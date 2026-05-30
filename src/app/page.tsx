"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { ChainBalanceGrid } from "@/components/portfolio/chain-balance-grid";
import { HomeCinematicHero } from "@/components/home/home-cinematic-hero";
import { HomeFeatureGrid } from "@/components/home/home-feature-grid";
import { MotionScrollReveal } from "@/components/motion/motion-primitives";
import { NeoGlass } from "@/components/ui/neo-glass";
import { PremiumIcon } from "@/components/ui/premium-icon";
import { useDashboard } from "@/hooks/use-dashboard";
import { useNetwork } from "@/providers/network-context";
import {
  Wallet,
  TrendingUp,
  Layers,
  Zap,
  ArrowRight,
  RefreshCw,
  Globe,
} from "lucide-react";
import { formatUsd, formatPct } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { network } = useNetwork();
  const { data, loading, refresh } = useDashboard(isConnected ? address : undefined);

  const analysis = data?.analysis;
  const health = data?.health;
  const totalUsd = analysis?.totalUsd ?? 0;
  const change24h =
    analysis?.change24hPct ??
    (data?.markets
      ? (data.markets.ethChange24h + data.markets.btcChange24h) / 2
      : 0);
  const regime = (analysis?.regime ??
    data?.macroRegime ??
    "neutral") as MarketRegime;
  const trend = change24h >= 0 ? "up" : ("down" as const);

  return (
    <AppShell title="Overview" subtitle="" variant="home">
      <HomeCinematicHero
        compact={isConnected}
        showCta={!isConnected}
        walletPreview={
          isConnected && analysis
            ? { totalUsd, change24hPct: change24h }
            : undefined
        }
      />

      <div className="home-content space-y-8">
        <MotionScrollReveal>
          <NeoGlass glow="indigo" padding="none" className="home-ticker-wrap overflow-hidden">
            <MarketTicker />
            <CoinStrip />
          </NeoGlass>
        </MotionScrollReveal>

        {!isConnected && (
          <MotionScrollReveal>
            <HomeFeatureGrid />
          </MotionScrollReveal>
        )}

        {isConnected && (
          <MotionScrollReveal>
          <div className="space-y-8">
            <span className="home-connected-badge">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              {data?.networkMode ?? network} · live balances
            </span>

            {data?.hint && (
              <NeoGlass glow="amber" padding="md" className="text-sm text-amber-100">
                {data.hint}{" "}
                <Link href="/execute" className="font-semibold text-cyan-300">
                  Fund →
                </Link>
              </NeoGlass>
            )}

            {analysis ? (
              <PortfolioHero
                totalUsd={totalUsd}
                change24hPct={change24h}
                regime={regime}
                chainCount={data?.chainBalances?.length ?? health?.chainCount ?? 0}
                sparkline={data?.sparkline ?? []}
                sources={health?.sources ?? ["Zerion", "GoldRush"]}
                loading={loading}
              />
            ) : (
              <NeoGlass glow="indigo" padding="lg" className="text-center">
                <p className="text-slate-300">
                  {loading ? "Scanning all chains…" : "No balance yet — use Fund tab."}
                </p>
              </NeoGlass>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => refresh()}
                className="home-btn home-btn--ghost !min-h-[2.5rem] !px-4 !text-xs"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Sync live data
              </button>
              {data?.dataFreshness && (
                <span className="self-center text-xs text-slate-500">
                  Updated {new Date(data.dataFreshness).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="home-stat-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Net worth"
                value={loading ? "…" : formatUsd(totalUsd)}
                sub={formatPct(change24h) + " 24h"}
                icon={Wallet}
                trend={trend}
                variant="cyan"
              />
              <StatCard
                label="Chains"
                value={String(data?.chainBalances?.length ?? 0)}
                sub="Multichain scan"
                icon={Globe}
                variant="violet"
              />
              <StatCard
                label="Regime"
                value={regime.replace("-", " ")}
                sub="CoinGecko + portfolio"
                icon={TrendingUp}
                variant="emerald"
              />
              <StatCard
                label="Rebalance"
                value={String(analysis?.rebalanceActions.length ?? 0)}
                sub="Suggested moves"
                icon={Layers}
                variant="amber"
              />
            </div>

            {data?.chainBalances && data.chainBalances.length > 0 && (
              <NeoGlass glow="cyan" padding="lg">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <PremiumIcon icon={Globe} variant="cyan" size="sm" />
                  <span className="text-slate-500">/</span> By chain
                </h3>
                <ChainBalanceGrid chains={data.chainBalances} />
              </NeoGlass>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <NeoGlass glow="violet" padding="lg">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold text-white">
                    <PremiumIcon icon={Zap} variant="violet" size="sm" />
                    <span className="text-slate-500">/</span> Quick actions
                  </h3>
                  <RegimeBadge regime={regime} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/execute"
                    className="home-btn home-btn--primary justify-center !w-full"
                  >
                    <Zap className="h-4 w-4" /> Execute
                  </Link>
                  <Link
                    href="/portfolio"
                    className="home-btn home-btn--ghost justify-center !w-full"
                  >
                    Portfolio <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </NeoGlass>
              <NeoGlass glow="indigo" padding="sm" className="overflow-hidden">
                <ActivityFeed />
              </NeoGlass>
            </div>
          </div>
          </MotionScrollReveal>
        )}
      </div>
    </AppShell>
  );
}
