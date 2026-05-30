"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { HomeWelcome } from "@/components/home/home-welcome";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { useDashboard } from "@/hooks/use-dashboard";
import { useNetwork } from "@/providers/network-context";
import { Zap, ArrowRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
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

  return (
    <AppShell title="Overview" subtitle="" variant="home">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        {!walletReady && (
          <div className="portfolio-hero-premium flex min-h-[280px] items-center justify-center p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          </div>
        )}

        {walletReady && !isConnected && <HomeWelcome />}

        {walletReady && isConnected && (
          <>
            <div className="home-market-strip overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
              <MarketTicker variant="glass" />
              <CoinStrip variant="glass" />
            </div>

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
                sources={health?.sources ?? ["Zerion", "Covalent"]}
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

            <p className="text-center text-[11px] text-slate-500">
              Cinematic glass theme & full adaptive portfolio →{" "}
              <Link href="/portfolio" className="text-cyan-400/90 hover:text-cyan-300">
                Portfolio tab
              </Link>
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
