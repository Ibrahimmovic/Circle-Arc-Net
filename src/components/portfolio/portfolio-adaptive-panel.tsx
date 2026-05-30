"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { AllocationChart } from "./allocation-chart";
import { formatUsd } from "@/lib/utils";
import type { PortfolioAnalysis } from "@/lib/types";

export function PortfolioAdaptivePanel({
  analysis,
}: {
  analysis: PortfolioAnalysis;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Allocation</h3>
          <p className="mt-1 text-xs text-slate-500">
            Live weights vs adaptive targets ({analysis.regime})
          </p>
          <AllocationChart data={analysis.chainAllocations} />
        </div>
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Adaptive vs now</h3>
          <ul className="mt-4 space-y-2">
            {analysis.targetAllocations.map((t) => {
              const current = analysis.chainAllocations.find(
                (c) => c.chain.toLowerCase() === t.chain.toLowerCase(),
              );
              const currentPct = current?.percent ?? 0;
              const drift = currentPct - t.targetPercent;
              return (
                <li
                  key={t.chain}
                  className="rounded-xl bg-slate-900/50 px-4 py-3"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-200">{t.chain}</span>
                    <span className="font-mono text-cyan-300">
                      {currentPct.toFixed(1)}% → {t.targetPercent}%
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-[10px] ${
                      Math.abs(drift) < 5
                        ? "text-emerald-400/80"
                        : drift > 0
                          ? "text-amber-300/90"
                          : "text-violet-300/90"
                    }`}
                  >
                    {Math.abs(drift) < 5
                      ? "On target"
                      : drift > 0
                        ? `Overweight +${drift.toFixed(1)}%`
                        : `Underweight ${drift.toFixed(1)}%`}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Concentration:{" "}
            <span className="text-violet-300">{analysis.concentrationRisk}</span>
            {" · "}
            Regime <span className="text-cyan-300/90">{analysis.regime}</span>
          </p>
        </div>
      </div>

      <div id="rebalance" className="glass-panel scroll-mt-24 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Adaptive rebalances</h3>
        </div>
        {analysis.arcAdvantage && (
          <p className="mt-3 text-sm text-slate-400">{analysis.arcAdvantage}</p>
        )}
        {analysis.rebalanceActions.length === 0 ? (
          <p className="mt-4 text-slate-400">
            Portfolio aligned with current macro regime.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {analysis.rebalanceActions.map((action, i) => (
              <motion.li
                key={action.id}
                initial={{ opacity: 0, y: 6 }}
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
                  Execute on Arc <Zap className="h-3 w-3" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
