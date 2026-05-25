"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { HeroOrbit } from "@/components/dashboard/hero-orbit";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import {
  Wallet,
  TrendingUp,
  Layers,
  Shield,
  ArrowRight,
} from "lucide-react";
import { formatUsd, formatPct } from "@/lib/utils";
import type { PortfolioAnalysis, CircleHealth } from "@/lib/types";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const watchAddress = address ?? DEMO;
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [health, setHealth] = useState<CircleHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [aRes, hRes] = await Promise.all([
          fetch(`/api/portfolio/analyze?address=${watchAddress}`),
          fetch("/api/health"),
        ]);
        const aJson = await aRes.json();
        const hJson = await hRes.json();
        if (!cancelled) {
          if (aRes.ok) setAnalysis(aJson.analysis);
          setHealth(hJson);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [watchAddress]);

  const trend =
    (analysis?.change24hPct ?? 0) >= 0 ? "up" : ("down" as const);

  return (
    <AppShell
      title="Command Center"
      subtitle="Adaptive portfolio intelligence · Circle CCTP execution on Arc"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-8">
          <div className="glass-panel glow-border overflow-hidden rounded-3xl p-8 lg:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
                  Agora Agent Hackathon · RFB 04 + 05
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  Markets as the{" "}
                  <span className="text-gradient">agora</span> — agents as
                  citizens
                </h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  Continuous regime detection, cross-chain rebalancing, and
                  USDC-native execution via Circle Wallets, App Kit (CCTP),
                  Zerion portfolio data, and GoldRush multichain balances.
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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 hover:border-violet-500/50 hover:text-violet-200"
                  >
                    Execute Cross-Chain
                  </Link>
                </div>
              </div>
              <HeroOrbit />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Portfolio Value"
              value={
                loading
                  ? "—"
                  : formatUsd(analysis?.totalUsd ?? 0)
              }
              sub={
                analysis
                  ? formatPct(analysis.change24hPct) + " 24h"
                  : undefined
              }
              icon={Wallet}
              trend={trend}
            />
            <StatCard
              label="Market Regime"
              value={analysis?.regime?.replace("-", " ") ?? "—"}
              sub="Agent-detected"
              icon={TrendingUp}
            />
            <StatCard
              label="Rebalance Queue"
              value={String(analysis?.rebalanceActions.length ?? 0)}
              sub="CCTP-ready actions"
              icon={Layers}
            />
            <StatCard
              label="Circle Stack"
              value={health?.kitKeyPresent ? "Live" : "Setup"}
              sub={`${health?.walletCount ?? 0} programmable wallets`}
              icon={Shield}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active regime
            </p>
            <div className="mt-4">
              {analysis ? (
                <RegimeBadge regime={analysis.regime} />
              ) : (
                <span className="text-slate-500">Loading…</span>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              {analysis?.arcAdvantage ??
                "Arc enables sub-second USDC settlement for agent rebalancing."}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Watching
            </p>
            <p className="mt-2 font-mono text-xs text-cyan-300/90 break-all">
              {watchAddress}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {isConnected
                ? "Connected wallet — live analysis"
                : "Demo wallet — connect for yours"}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
              Integrations
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              {(health?.products ?? []).map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
