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
    <AppShell
      title="Overview"
      subtitle="Live multichain wallet · Circle CCTP · Arc USDC fees"
    >
      <div className="mb-6 space-y-4">
        <MarketTicker />
        <CoinStrip />
      </div>

      {!isConnected && (
        <div className="luxury-hero rounded-2xl p-6 text-center sm:rounded-3xl sm:p-10">
          <p className="font-display text-2xl font-bold text-white sm:text-3xl">
            Your cross-chain command desk
          </p>
          <p className="mx-auto mt-4 max-w-lg text-slate-300">
            Real balances from Zerion + GoldRush across Ethereum, Base, Polygon,
            Arbitrum & more — not demo numbers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/execute" className="btn-primary rounded-xl px-8 py-3 text-sm font-bold text-white">
              Bridge · Swap · Send
            </Link>
            <Link
              href="/portfolio"
              className="rounded-xl border border-cyan-500/40 px-8 py-3 text-sm font-semibold text-cyan-200"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      )}

      {isConnected && (
        <div className="space-y-8">
          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {data?.networkMode ?? network} balances only
          </span>

          {data?.hint && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {data.hint}{" "}
              <Link href="/execute" className="font-semibold text-cyan-300">
                Fund →
              </Link>
            </div>
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
            <div className="luxury-card rounded-2xl p-8 text-center">
              <p className="text-slate-300">
                {loading ? "Scanning all chains…" : "No balance yet — use Fund tab."}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-cyan-500/40"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sync live data
            </button>
            {data?.dataFreshness && (
              <span className="text-xs text-slate-500 self-center">
                Updated {new Date(data.dataFreshness).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net worth"
              value={loading ? "…" : formatUsd(totalUsd)}
              sub={formatPct(change24h) + " 24h"}
              icon={Wallet}
              trend={trend}
            />
            <StatCard
              label="Chains"
              value={String(data?.chainBalances?.length ?? 0)}
              sub="Multichain scan"
              icon={Globe}
            />
            <StatCard
              label="Regime"
              value={regime.replace("-", " ")}
              sub="CoinGecko + portfolio"
              icon={TrendingUp}
            />
            <StatCard
              label="Rebalance"
              value={String(analysis?.rebalanceActions.length ?? 0)}
              sub="Suggested moves"
              icon={Layers}
            />
          </div>

          {data?.chainBalances && data.chainBalances.length > 0 && (
            <div className="luxury-card rounded-2xl p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">By chain</h3>
              <ChainBalanceGrid chains={data.chainBalances} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="luxury-card rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Quick actions</h3>
                <RegimeBadge regime={regime} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/execute"
                  className="btn-primary flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
                >
                  <Zap className="h-4 w-4" /> Execute
                </Link>
                <Link
                  href="/portfolio"
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 py-3 text-sm font-semibold text-violet-200"
                >
                  Portfolio <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <ActivityFeed />
          </div>
        </div>
      )}
    </AppShell>
  );
}
