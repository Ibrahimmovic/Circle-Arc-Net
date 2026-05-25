"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/app-shell";
import { Bot, RefreshCw, CircleDot } from "lucide-react";
import type { PortfolioAnalysis } from "@/lib/types";
import Link from "next/link";
import { Wallet } from "lucide-react";

const AGENT_STEPS = [
  "Ingest Zerion portfolio + GoldRush multichain balances",
  "Detect market regime from 24h momentum",
  "Compute cross-chain drift vs regime targets",
  "Queue CCTP rebalance actions for Circle App Kit",
  "Execute on Arc-optimized USDC fee surface",
];

export default function AgentPage() {
  const { address, isConnected } = useAccount();
  const watchAddress = isConnected ? address : undefined;
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!watchAddress) {
      setAnalysis(null);
      return;
    }
    fetch(`/api/portfolio/analyze?address=${watchAddress}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.analysis) setAnalysis(j.analysis);
      });
  }, [watchAddress, tick]);

  useEffect(() => {
    const lines = [
      `[${new Date().toISOString()}] Agent cycle #${tick + 1}`,
      `Regime: ${analysis?.regime ?? "pending"}`,
      `Actions queued: ${analysis?.rebalanceActions.length ?? 0}`,
      `Circle Kit: ${process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY ? "configured" : "missing"}`,
    ];
    setLog((prev) => [...lines, ...prev].slice(0, 20));
  }, [analysis, tick]);

  return (
    <AppShell
      title="Agent Console"
      subtitle="Autonomous portfolio participant — 24/7 agora monitoring"
    >
      {!isConnected && (
        <div className="panel-elevated mb-6 rounded-2xl p-8 text-center">
          <Wallet className="mx-auto h-10 w-10 text-violet-300" />
          <p className="mt-4 font-display text-xl font-bold text-white">
            Connect wallet to run the agent
          </p>
          <p className="mt-2 text-slate-300">
            Agent cycles analyze your connected wallet only — no demo address.
          </p>
          <Link
            href="/execute"
            className="btn-primary mt-6 inline-block rounded-xl px-8 py-3 text-sm font-bold text-white"
          >
            Get USDC on Execute
          </Link>
        </div>
      )}

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
            disabled={!isConnected}
            onClick={() => setTick((t) => t + 1)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
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
