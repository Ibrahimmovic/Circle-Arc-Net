"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { PremiumIcon } from "@/components/ui/premium-icon";
import { GlassPanel, LiquidGlassButton } from "@/components/ui/glass-ui";
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
  const { address, isConnected, status } = useAccount();
  const [walletReady, setWalletReady] = useState(false);
  const { network } = useNetwork();
  const { data, loading, refresh } = useDashboard(isConnected ? address : undefined);

  useEffect(() => {
    if (status !== "connecting" && status !== "reconnecting") {
      setWalletReady(true);
    }
  }, [status]);

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

  if (!walletReady) {
    return (
      <AppShell title="Overview" subtitle="" variant="home">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
        </div>
      </AppShell>
    );
  }

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
          <GlassPanel strong className="overflow-hidden">
            <MarketTicker variant="glass" />
            <CoinStrip variant="glass" />
          </GlassPanel>
        </MotionScrollReveal>

        {!isConnected && (
          <MotionScrollReveal>
            <HomeFeatureGrid />
          </MotionScrollReveal>
        )}

        {isConnected && (
          <MotionScrollReveal>
            <div className="space-y-8">
              <span className="home-connected-badge inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                {data?.networkMode ?? network} · live balances
              </span>

              {data?.hint && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {data.hint}{" "}
                  <Link
                    href="/execute"
                    className="font-semibold text-white underline-offset-2 hover:underline"
                  >
                    Fund →
                  </Link>
                </div>
              )}

              {analysis ? (
                <PortfolioHero
                  variant="glass"
                  totalUsd={totalUsd}
                  change24hPct={change24h}
                  regime={regime}
                  chainCount={data?.chainBalances?.length ?? health?.chainCount ?? 0}
                  sparkline={data?.sparkline ?? []}
                  sources={health?.sources ?? ["Zerion", "Covalent"]}
                  dataSourceLabel={health?.sources?.join(" · ")}
                  loading={loading}
                />
              ) : (
                <GlassPanel strong className="p-8 text-center">
                  <p className="text-white/60">
                    {loading ? "Scanning all chains…" : "No balance yet — use Fund tab."}
                  </p>
                </GlassPanel>
              )}

              <div className="flex flex-wrap gap-3">
                <LiquidGlassButton href="/execute" variant="primary">
                  <Zap className="h-4 w-4" />
                  Open Execute
                </LiquidGlassButton>
                <LiquidGlassButton href="/portfolio" variant="secondary">
                  Portfolio
                  <ArrowRight className="h-4 w-4" />
                </LiquidGlassButton>
                <LiquidGlassButton variant="ghost" onClick={() => refresh()}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Sync
                </LiquidGlassButton>
                {data?.dataFreshness && (
                  <span className="self-center text-xs text-white/45">
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
                <GlassPanel strong className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/55">
                    <PremiumIcon icon={Globe} variant="cyan" size="sm" />
                    By chain
                  </h3>
                  <ChainBalanceGrid chains={data.chainBalances} />
                </GlassPanel>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <GlassPanel strong className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/55">
                      <PremiumIcon icon={Zap} variant="violet" size="sm" />
                      Quick actions
                    </h3>
                    <RegimeBadge regime={regime} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <LiquidGlassButton href="/execute" variant="primary" className="!w-full">
                      <Zap className="h-4 w-4" /> Execute
                    </LiquidGlassButton>
                    <LiquidGlassButton href="/portfolio" variant="secondary" className="!w-full">
                      Portfolio <ArrowRight className="h-4 w-4" />
                    </LiquidGlassButton>
                  </div>
                </GlassPanel>
                <GlassPanel strong className="overflow-hidden p-1">
                  <ActivityFeed />
                </GlassPanel>
              </div>
            </div>
          </MotionScrollReveal>
        )}
      </div>
    </AppShell>
  );
}
