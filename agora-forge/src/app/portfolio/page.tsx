"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { formatUsd, formatPct } from "@/lib/utils";
import type { PortfolioAnalysis } from "@/lib/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

interface PositionRow {
  id: string;
  name?: string;
  value: number;
  change24h: number;
  chain?: string;
}

export default function PortfolioPage() {
  const { address } = useAccount();
  const watchAddress = address ?? DEMO;
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(
        `/api/portfolio/analyze?address=${watchAddress}`,
      );
      const json = await res.json();
      if (!cancelled && res.ok) {
        setAnalysis(json.analysis);
        setPositions(json.topPositions ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [watchAddress]);

  return (
    <AppShell
      title="Adaptive Portfolio"
      subtitle="Regime-aware targets · cross-chain drift detection · agent rebalance queue"
    >
      {loading && (
        <p className="text-slate-400 animate-pulse">Scanning multichain agora…</p>
      )}

      {analysis && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <RegimeBadge regime={analysis.regime} />
            <span className="text-2xl font-bold text-white">
              {formatUsd(analysis.totalUsd)}
            </span>
            <span
              className={
                analysis.change24hPct >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }
            >
              {formatPct(analysis.change24hPct)} 24h
            </span>
            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">
              Concentration: {analysis.concentrationRisk}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white">
                Current allocation
              </h3>
              <AllocationChart data={analysis.chainAllocations} />
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white">
                Regime targets ({analysis.regime})
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
              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                {analysis.targetAllocations[0]?.rationale}
              </p>
            </div>
          </div>

          <div className="glass-panel glow-border rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">
                Agent rebalance queue
              </h3>
              <Link
                href="/execute"
                className="flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
              >
                Execute via CCTP <Zap className="h-4 w-4" />
              </Link>
            </div>

            {analysis.rebalanceActions.length === 0 ? (
              <p className="mt-4 text-slate-400">
                Portfolio aligned with regime targets (drift &lt; 5%).
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {analysis.rebalanceActions.map((action, i) => (
                  <motion.li
                    key={action.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-white">
                        Bridge {formatUsd(action.amountUsd)} USDC
                      </p>
                      <p className="text-sm text-slate-400">
                        {action.fromChain} → {action.toChain} ·{" "}
                        {action.reason}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        action.priority === "high"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {action.priority}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Top holdings</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-3 pr-4">Asset</th>
                    <th className="pb-3 pr-4">Chain</th>
                    <th className="pb-3 pr-4 text-right">Value</th>
                    <th className="pb-3 text-right">24h</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-800/60 text-slate-300"
                    >
                      <td className="py-3 pr-4 font-medium text-white">
                        {p.name ?? "—"}
                      </td>
                      <td className="py-3 pr-4 capitalize">{p.chain}</td>
                      <td className="py-3 pr-4 text-right font-mono">
                        {formatUsd(p.value)}
                      </td>
                      <td
                        className={`py-3 text-right ${
                          p.change24h >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatPct(p.change24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
