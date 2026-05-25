"use client";

import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatUsd, formatPct } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, RefreshCw, AlertTriangle } from "lucide-react";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export default function PortfolioPage() {
  const { address } = useAccount();
  const watchAddress = address ?? DEMO;
  const { data, loading, refresh } = useDashboard(watchAddress);
  const analysis = data?.analysis;
  const positions = data?.topPositions ?? [];

  return (
    <AppShell
      title="Adaptive Portfolio"
      subtitle="Regime targets · drift detection · CCTP rebalance queue"
    >
      <MarketTicker />

      {data?.hint && !analysis && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="h-5 w-5" />
          {data.hint}
          <Link href="/execute" className="ml-auto font-semibold text-cyan-300">
            Fund wallet →
          </Link>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => refresh()}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Sync portfolio
        </button>
      </div>

      {loading && !analysis && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-slate-400">Scanning multichain agora…</p>
        </div>
      )}

      {analysis && (
        <div className="mt-8 space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <RegimeBadge regime={analysis.regime} />
            <span className="text-3xl font-bold text-white">
              {formatUsd(analysis.totalUsd)}
            </span>
            <span
              className={
                analysis.change24hPct >= 0
                  ? "text-emerald-400 text-lg"
                  : "text-rose-400 text-lg"
              }
            >
              {formatPct(analysis.change24hPct)} 24h
            </span>
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">
              Risk: {analysis.concentrationRisk}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel glow-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white">
                Chain allocation
              </h3>
              <AllocationChart data={analysis.chainAllocations} />
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white">
                Targets · {analysis.regime}
              </h3>
              <ul className="mt-4 space-y-3">
                {analysis.targetAllocations.map((t) => (
                  <li
                    key={t.chain}
                    className="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-200">
                      {t.chain}
                    </span>
                    <span className="font-mono text-cyan-300">
                      {t.targetPercent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass-panel glow-border rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">
                Rebalance queue
              </h3>
              <Link
                href="/execute"
                className="flex items-center gap-2 text-sm text-cyan-300"
              >
                Execute <Zap className="h-4 w-4" />
              </Link>
            </div>

            {analysis.rebalanceActions.length === 0 ? (
              <p className="mt-4 text-slate-400">Aligned with regime (drift &lt; 5%).</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {analysis.rebalanceActions.map((action, i) => (
                  <motion.li
                    key={action.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 py-4"
                  >
                    <p className="font-medium text-white">
                      Bridge {formatUsd(action.amountUsd)} USDC
                    </p>
                    <p className="text-sm text-slate-400">
                      {action.fromChain} → {action.toChain}
                    </p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {positions.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-white mb-4">
                Holdings
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Chain</th>
                    <th className="pb-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-800/60 text-slate-300"
                    >
                      <td className="py-3 font-medium text-white">
                        {p.name}
                      </td>
                      <td className="py-3">{p.chain}</td>
                      <td className="py-3 text-right font-mono">
                        {formatUsd(p.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
