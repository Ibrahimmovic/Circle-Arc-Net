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
import { Forge3DHero } from "@/components/ui/forge-3d-hero";
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
  ArrowLeftRight,
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
      <Forge3DHero compact={isConnected} showCta={!isConnected} />

      <div className="mb-6 mt-8 space-y-4">
        <MarketTicker />
        <CoinStrip />
      </div>

      {!isConnected && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ArrowLeftRight,
              label: "Swap & Bridge",
              text: "Quote, compare routes, execute in one flow.",
              href: "/execute",
              variant: "cyan" as const,
            },
            {
              icon: Globe,
              label: "Portfolio",
              text: "Multichain net worth, tokens, NFTs, activity.",
              href: "/portfolio",
              variant: "violet" as const,
            },
            {
              icon: Zap,
              label: "Agent",
              text: "Save goals and run portfolio-linked CCTP.",
              href: "/agent",
              variant: "emerald" as const,
            },
          ].map(({ icon, label, text, href, variant }) => (
            <Link
              key={href}
              href={href}
              className="premium-feature-card group"
            >
              <PremiumIcon icon={icon} variant={variant} size="lg" />
              <p className="mt-4 font-display text-sm font-bold text-white">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
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
              <span className="self-center text-xs text-slate-500">
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
            <div className="luxury-card card-shine rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <PremiumIcon icon={Globe} variant="cyan" size="sm" />
                By chain
              </h3>
              <ChainBalanceGrid chains={data.chainBalances} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="luxury-card card-shine rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <PremiumIcon icon={Zap} variant="violet" size="sm" />
                  Quick actions
                </h3>
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
