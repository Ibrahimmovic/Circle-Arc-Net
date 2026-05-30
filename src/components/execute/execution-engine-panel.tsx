"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Zap,
  Bot,
  Route,
  Loader2,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { ExecutionOpportunity, ExecutionPlan } from "@/lib/cross-chain-execution";
import { formatUsd } from "@/lib/utils";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const STATUS_STYLES = {
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  beta: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  planned: "bg-slate-800 text-slate-500 border-slate-700",
} as const;

function KindIcon({ kind }: { kind: ExecutionOpportunity["kind"] }) {
  if (kind === "arbitrage") return <Route className="h-4 w-4 text-amber-300" />;
  if (kind === "portfolio_rebalance") return <Bot className="h-4 w-4 text-violet-300" />;
  return <Zap className="h-4 w-4 text-cyan-300" />;
}

export function ExecutionEnginePanel({
  onPrefillBridge,
  onOpenQueue,
}: {
  /** Scroll user to Exchange tab and prefill bridge chains */
  onPrefillBridge?: (from: string, to: string) => void;
  onOpenQueue?: () => void;
}) {
  const { address } = useAccount();
  const watch = address ?? DEMO;
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/execute/plan?address=${watch}`);
      const json = await res.json();
      if (res.ok) setPlan(json.plan);
    } finally {
      setLoading(false);
    }
  }, [watch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Cross-chain execution engine
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Not only bridge/swap — a routing layer for{" "}
              <strong className="text-slate-300">CCTP</strong>,{" "}
              <strong className="text-slate-300">adaptive rebalance</strong>,{" "}
              <strong className="text-slate-300">arbitrage signals</strong> (RFB
              #5), and planned{" "}
              <strong className="text-slate-300">Intent tab</strong> for one-shot routes.
              Live actions run on Circle App Kit below.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenQueue?.()}
              className="rounded-lg bg-violet-600/80 px-3 py-2 text-xs font-semibold text-white"
            >
              Open queue
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300 hover:text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </button>
          </div>
        </div>

        {plan?.summary && (
          <p className="mt-4 rounded-lg bg-slate-900/60 px-3 py-2 text-xs text-cyan-200/90">
            {plan.summary}
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {plan?.rails.map((rail) => (
            <div
              key={rail.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">{rail.label}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLES[rail.status]}`}
                >
                  {rail.status}
                </span>
              </div>
              <p className="mt-2 text-[10px] leading-snug text-slate-500">
                {rail.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white">Execution queue</h3>
        <p className="mt-1 text-xs text-slate-500">
          Opportunities from portfolio drift + cross-chain arb heuristics
        </p>

        {!plan?.opportunities.length && !loading && (
          <p className="mt-6 text-center text-sm text-slate-500">
            No signals yet — fund wallet or use demo address.
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {plan?.opportunities.map((opp) => (
            <li
              key={opp.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex gap-3">
                  <KindIcon kind={opp.kind} />
                  <div>
                    <p className="font-medium text-white">{opp.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{opp.description}</p>
                    <p className="mt-2 text-[10px] text-slate-500">{opp.executeHint}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-mono text-cyan-200">{formatUsd(opp.amountUsd)}</p>
                  {opp.estimatedEdgeBps != null && (
                    <p className="text-amber-300/90">~{opp.estimatedEdgeBps} bps edge</p>
                  )}
                  <p className="mt-1 capitalize text-slate-500">{opp.priority} priority</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {opp.fromChain && opp.toChain && onPrefillBridge ? (
                  <button
                    type="button"
                    onClick={() => onPrefillBridge(opp.fromChain!, opp.toChain!)}
                    className="flex items-center gap-1 rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                  >
                    {opp.executable ? "Prefill bridge" : "Route"}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenQueue?.()}
                  className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-[10px] text-slate-300"
                >
                  Add to queue
                </button>
                {opp.fromChain && opp.toChain && (
                  <span className="text-[10px] text-slate-500">
                    {opp.fromChain} → {opp.toChain}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
