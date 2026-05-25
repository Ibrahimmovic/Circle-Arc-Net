"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { HeroOrbit } from "@/components/dashboard/hero-orbit";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  Wallet,
  TrendingUp,
  Layers,
  Shield,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { formatUsd, formatPct } from "@/lib/utils";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { data, loading, refresh } = useDashboard(isConnected ? address : undefined);

  const analysis = data?.analysis;
  const health = data?.health;
  const trend =
    (analysis?.change24hPct ?? 0) >= 0 ? "up" : ("down" as const);

  return (
    <AppShell
      title="Command Center"
      subtitle="Adaptive portfolio · Circle CCTP · Swap Kit · testnet-ready"
    >
      <div className="mb-6 space-y-4">
        <MarketTicker />
        {!isConnected && (
          <div className="panel-elevated rounded-2xl p-8 text-center">
            <p className="font-display text-xl font-bold text-white">
              Connect your wallet to start
            </p>
            <p className="mt-2 text-slate-300">
              Use the button top-right · Testnet: Base Sepolia · Fees in Arc USDC
            </p>
            <Link
              href="/execute"
              className="btn-primary mt-6 inline-block rounded-xl px-8 py-3 text-sm font-bold text-white"
            >
              Bridge & Swap on Execute
            </Link>
          </div>
        )}
        {isConnected && data?.hint && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {data.hint}
            </span>
            <Link
              href="/execute"
              className="font-semibold text-amber-300 hover:text-amber-200"
            >
              Fund on Execute →
            </Link>
          </div>
        )}
      </div>

      {isConnected && (
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-8">
          <div className="glass-panel glow-border overflow-hidden rounded-3xl p-8 lg:p-10 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
                  Circle × Arc · Agora Hackathon
                </p>
                <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  Markets as the{" "}
                  <span className="text-gradient">agora</span> — agents as
                  citizens
                </h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Live regime detection, multichain balances, CCTP bridge, Swap
                  Kit, and Circle faucet — all USDC-denominated fees.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-5 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-500/40 hover:bg-cyan-500/30"
                  >
                    View Portfolio <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/execute"
                    className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Bridge & Swap
                  </Link>
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300 hover:border-cyan-500/40"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>
              </div>
              <HeroOrbit />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Portfolio Value"
              value={loading ? "…" : formatUsd(analysis?.totalUsd ?? 0)}
              sub={
                analysis
                  ? formatPct(analysis.change24hPct ?? 0) + " 24h"
                  : data?.markets
                    ? `ETH ${formatPct(data.markets.ethChange24h ?? 0)} macro`
                    : undefined
              }
              icon={Wallet}
              trend={trend}
            />
            <StatCard
              label="Market Regime"
              value={
                analysis?.regime?.replace("-", " ") ??
                data?.macroRegime?.replace("-", " ") ??
                "—"
              }
              sub="Agent + macro"
              icon={TrendingUp}
            />
            <StatCard
              label="Rebalance Queue"
              value={String(analysis?.rebalanceActions.length ?? 0)}
              sub="CCTP-ready"
              icon={Layers}
            />
            <StatCard
              label="Circle Stack"
              value={
                health?.apisConfigured?.circle && health?.apisConfigured?.kit
                  ? "Live"
                  : "Check env"
              }
              sub={`${health?.network ?? "testnet"} · ${health?.walletCount ?? 0} wallets`}
              icon={Shield}
            />
          </div>

          <ActivityFeed />
        </section>

        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl p-6 glow-border">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active regime
            </p>
            <div className="mt-4">
              {analysis ? (
                <RegimeBadge regime={analysis.regime} />
              ) : data?.macroRegime ? (
                <RegimeBadge
                  regime={
                    data.macroRegime as "risk-on" | "neutral" | "risk-off"
                  }
                />
              ) : (
                <span className="text-slate-500">
                  {loading ? "Loading…" : "Fund wallet for portfolio"}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              {analysis?.arcAdvantage ??
                "Arc: sub-second finality, ~$0.01 USDC tx fees for agents."}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Watching
            </p>
            {isConnected && address && (
              <>
                <p className="mt-2 font-mono text-xs text-cyan-300 break-all">
                  {address}
                </p>
                <p className="mt-2 text-xs text-slate-400">Live portfolio sync</p>
              </>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
              Data sources
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              {(health?.sources ?? [
                "Circle Wallets",
                "App Kit CCTP",
                "Swap Kit",
                "Zerion",
                "GoldRush",
                "CoinGecko",
              ]).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
            {health?.apisConfigured && (
              <div className="mt-4 flex flex-wrap gap-1">
                {Object.entries(health.apisConfigured).map(([k, v]) => (
                  <span
                    key={k}
                    className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                      v
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      )}
    </AppShell>
  );
}
