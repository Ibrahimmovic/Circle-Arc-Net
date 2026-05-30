"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Bot, Play, Loader2, CircleDot } from "lucide-react";
import type { PortfolioAnalysis } from "@/lib/types";
import type { ExecutionJob } from "@/lib/execution/types";
import { runExecutionQueue } from "@/lib/execution/orchestrator";

const DEMO =
  process.env.NEXT_PUBLIC_DEMO_WALLET ??
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

export default function AgentPage() {
  const { address, isConnected } = useAccount();
  const watch = address ?? DEMO;
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [jobs, setJobs] = useState<ExecutionJob[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const push = (line: string) => setLog((p) => [line, ...p].slice(0, 24));

  useEffect(() => {
    fetch(`/api/portfolio/wallet?address=${watch}&network=mainnet`)
      .then((r) => r.json())
      .then((j) => {
        if (j.analysis) setAnalysis(j.analysis);
      })
      .catch(() => {});
    fetch(`/api/execute/plan?address=${watch}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.jobs) setJobs(j.jobs);
      });
  }, [watch]);

  const runCycle = useCallback(async () => {
    if (!isConnected || !address) {
      push("Connect wallet to execute CCTP jobs.");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch(`/api/execute/plan?address=${address}`);
      const json = await res.json();
      const queue: ExecutionJob[] = json.jobs ?? [];
      setJobs(queue);
      push(`Regime: ${json.analysis?.regime ?? "?"} · ${queue.length} jobs`);

      const cctpJobs = queue.filter((j) =>
        j.steps.some((s) => s.rail === "cctp_bridge" && s.status === "pending"),
      );
      if (!cctpJobs.length) {
        push("No pending CCTP steps.");
        return;
      }

      const results = await runExecutionQueue(cctpJobs, {
        executorAddress: address,
        circleKitKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY,
        stopOnError: false,
        onProgress: ({ message }) => push(message),
      });
      push(results.map((r) => r.summary ?? r.status).join(" · "));
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  }, [address, isConnected]);

  return (
    <AppShell
      title="Agent Console"
      subtitle="Portfolio → plan → automated CCTP · manual runs on Execute"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="luxury-card rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <Bot className="h-10 w-10 text-violet-300" />
            <div>
              <h3 className="text-xl font-bold text-white">Agora Forge Agent</h3>
              <p className="text-sm text-slate-400">
                Portfolio read → execution plan → CCTP run
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Regime:{" "}
            <span className="text-cyan-200">{analysis?.regime ?? "—"}</span> ·
            Rebalance actions: {analysis?.rebalanceActions.length ?? 0} · Jobs:{" "}
            {jobs.length}
          </p>
          <button
            type="button"
            onClick={runCycle}
            disabled={running}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run execution cycle
          </button>
          <Link
            href="/execute"
            className="mt-3 block text-center text-xs text-cyan-400"
          >
            Open Cross-Chain Studio →
          </Link>
        </div>
        <div className="luxury-card rounded-2xl p-6 font-mono text-xs">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <CircleDot className="h-3 w-3 animate-pulse" />
            Telemetry
          </div>
          {log.map((line, i) => (
            <p key={i} className="border-b border-slate-800/50 py-2 text-slate-500">
              {line}
            </p>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
