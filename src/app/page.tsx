"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { HomeWelcome } from "@/components/home/home-welcome";
import { useDashboard } from "@/hooks/use-dashboard";
import { useNetwork } from "@/providers/network-context";
import { Zap, ArrowRight, RefreshCw } from "lucide-react";
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

  return (
    <AppShell title="Overview" subtitle="" variant="home">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        {!isConnected && <HomeWelcome />}

        {isConnected && (
          <>
            <span className="home-connected-badge inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              {data?.networkMode ?? network} · live balances
            </span>

            {data?.hint && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {data.hint}{" "}
                <Link href="/execute" className="font-semibold text-white underline-offset-2 hover:underline">
                  Fund →
                </Link>
              </div>
            )}

            {analysis ? (
              <PortfolioHero
                variant="classic"
                totalUsd={totalUsd}
                change24hPct={change24h}
                regime={regime}
                chainCount={data?.chainBalances?.length ?? health?.chainCount ?? 0}
                sparkline={data?.sparkline ?? []}
                sources={health?.sources ?? ["Zerion", "GoldRush"]}
                loading={loading}
              />
            ) : (
              <div className="portfolio-hero-premium p-8 text-center">
                <p className="text-slate-400">
                  {loading ? "Scanning all chains…" : "No balance yet — use Fund tab."}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href="/execute"
                className="premium-cta premium-cta--primary inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 sm:flex-none"
              >
                <Zap className="h-4 w-4" />
                Open Execute
              </Link>
              <Link
                href="/portfolio"
                className="premium-cta premium-cta--ghost inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 sm:flex-none"
              >
                Portfolio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => refresh()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-4 text-xs text-slate-400 hover:text-white touch-manipulation"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
