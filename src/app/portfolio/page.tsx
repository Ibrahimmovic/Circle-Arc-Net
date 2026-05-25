"use client";

import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { ChainBalanceGrid } from "@/components/portfolio/chain-balance-grid";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatUsd } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, RefreshCw, Wallet, Sparkles } from "lucide-react";
import type { MarketRegime } from "@/lib/types";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data, loading, refresh } = useDashboard(isConnected ? address : undefined);
  const analysis = data?.analysis;
  const positions = data?.topPositions ?? [];
  const regime = (analysis?.regime ?? "neutral") as MarketRegime;

  return (
    <AppShell
      title="Portfolio"
      subtitle="Full wallet balance across chains · Zerion · GoldRush · CoinGecko"
    >
      <MarketTicker />
      <div className="mt-4">
        <CoinStrip />
      </div>

      {!isConnected && (
        <div className="luxury-hero mt-8 rounded-3xl p-10 text-center">
          <Wallet className="mx-auto h-12 w-12 text-cyan-400" />
          <p className="mt-4 font-display text-2xl font-bold text-white">
            Connect to see your full net worth
          </p>
          <p className="mt-2 text-slate-400">
            We aggregate Ethereum, Base, Polygon, Arbitrum, Optimism, Avalanche & testnets
          </p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => refresh()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh multichain
            </button>
            {data?.health?.sources && (
              <span className="text-xs text-slate-500">
                {data.health.sources.join(" · ")}
              </span>
            )}
          </div>

          {loading && !analysis && (
            <div className="mt-16 flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
              <p className="text-slate-400">Scanning every chain…</p>
            </div>
          )}

          {analysis && (
            <div className="mt-8 space-y-8">
              <PortfolioHero
                totalUsd={analysis.totalUsd}
                change24hPct={analysis.change24hPct}
                regime={regime}
                chainCount={data?.chainBalances?.length ?? 0}
                sparkline={data?.sparkline ?? []}
                sources={data?.health?.sources ?? []}
              />

              <div className="luxury-card rounded-2xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  Balances by chain
                </h3>
                <ChainBalanceGrid chains={data?.chainBalances ?? []} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="luxury-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white">Allocation</h3>
                  <AllocationChart data={analysis.chainAllocations} />
                </div>
                <div className="luxury-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white">
                    Targets · {analysis.regime}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {analysis.targetAllocations.map((t) => (
                      <li
                        key={t.chain}
                        className="flex justify-between rounded-xl bg-slate-900/50 px-4 py-3"
                      >
                        <span className="text-slate-200">{t.chain}</span>
                        <span className="font-mono text-cyan-300">{t.targetPercent}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="luxury-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Suggested rebalances
                  </h3>
                  <Link href="/insights" className="text-sm text-cyan-300">
                    Why these? →
                  </Link>
                </div>
                {analysis.rebalanceActions.length === 0 ? (
                  <p className="mt-4 text-slate-400">Portfolio aligned with market regime.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {analysis.rebalanceActions.map((action, i) => (
                      <motion.li
                        key={action.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-4"
                      >
                        <p className="font-medium text-white">
                          Move {formatUsd(action.amountUsd)} USDC
                        </p>
                        <p className="text-sm text-slate-400">
                          {action.fromChain} → {action.toChain}
                        </p>
                        <Link
                          href="/execute"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400"
                        >
                          Execute bridge <Zap className="h-3 w-3" />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {positions.length > 0 && (
                <div className="luxury-card overflow-x-auto rounded-2xl p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Top holdings</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-3">Asset</th>
                        <th className="pb-3">Chain</th>
                        <th className="pb-3 text-right">USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800/50 text-slate-300">
                          <td className="py-3 font-medium text-white">{p.name}</td>
                          <td className="py-3">{p.chain ?? "—"}</td>
                          <td className="py-3 text-right font-mono">{formatUsd(p.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!analysis && !loading && data?.hint && (
            <p className="mt-8 text-center text-amber-200">{data.hint}</p>
          )}
        </>
      )}
    </AppShell>
  );
}
