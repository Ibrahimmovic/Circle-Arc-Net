"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { Bot, RefreshCw, CircleDot } from "lucide-react";
import type { PortfolioAnalysis } from "@/lib/types";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const AGENT_STEPS = [
  "Ingest Zerion portfolio + GoldRush multichain balances",
  "Detect market regime from 24h momentum",
  "Compute cross-chain drift vs regime targets",
  "Scan arb signals + execution queue (/api/execute/plan)",
  "Execute live legs via CCTP · plan intent/calldata routes",
];

export default function AgentPage() {
  const { address } = useAccount();
  const watchAddress = address ?? DEMO;
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [execCount, setExecCount] = useState(0);

  useEffect(() => {
    fetch(`/api/portfolio/analyze?address=${watchAddress}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.analysis) setAnalysis(j.analysis);
      });
  }, [watchAddress, tick]);

  useEffect(() => {
    fetch(`/api/execute/plan?address=${watchAddress}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.plan?.opportunities) setExecCount(j.plan.opportunities.length);
      })
      .catch(() => {});
  }, [watchAddress, tick]);

  useEffect(() => {
    const lines = [
      `[${new Date().toISOString()}] Agent cycle #${tick + 1}`,
      `Regime: ${analysis?.regime ?? "pending"}`,
      `Rebalance actions: ${analysis?.rebalanceActions.length ?? 0}`,
      `Execution queue: ${execCount} (rebalance + arb + planned intents)`,
      `Circle Kit: ${process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY ? "configured" : "missing"}`,
    ];
    setLog((prev) => [...lines, ...prev].slice(0, 20));
  }, [analysis, tick, execCount]);

  return (
    <AppShell
      title="Agent Console"
      subtitle="Autonomous portfolio participant — 24/7 agora monitoring"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel glow-border rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-500/20 p-4">
              <Bot className="h-8 w-8 text-violet-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Agora Forge Agent
              </h3>
              <p className="text-sm text-slate-400">
                Adaptive portfolio manager for hackathon RFB 04
              </p>
            </div>
          </div>

          <ol className="mt-8 space-y-4">
            {AGENT_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Run Agent Cycle
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6 font-mono text-xs">
          <div className="mb-4 flex items-center gap-2 text-emerald-400">
            <CircleDot className="h-3 w-3 animate-pulse" />
            Live telemetry
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2 text-slate-400">
            {log.map((line, i) => (
              <p key={`${line}-${i}`} className="border-b border-slate-800/40 pb-2">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
