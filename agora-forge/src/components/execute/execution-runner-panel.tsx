"use client";

import { useEffect } from "react";
import { Play, Loader2, ListChecks, CircleDot } from "lucide-react";
import { useExecutionRunner } from "@/hooks/use-execution-runner";
import type { ExecutionJob } from "@/lib/execution/types";

function statusColor(status: ExecutionJob["status"]) {
  switch (status) {
    case "success":
      return "text-emerald-400";
    case "failed":
      return "text-rose-400";
    case "running":
      return "text-cyan-300";
    case "partial":
      return "text-amber-300";
    default:
      return "text-slate-400";
  }
}

export function ExecutionRunnerPanel() {
  const { jobs, loading, running, log, loadQueue, runOne, runAll } =
    useExecutionRunner();

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ListChecks className="h-6 w-6 text-violet-300" />
          <div>
            <h3 className="text-lg font-semibold text-white">Execution queue</h3>
            <p className="text-xs text-slate-500">
              Auto-compiled jobs: CCTP · swap · arb · rebalance
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadQueue}
            disabled={loading || running}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={runAll}
            disabled={running || jobs.length === 0}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run all
          </button>
        </div>
      </div>

      {loading && (
        <p className="mt-4 text-center text-sm text-slate-500">Loading queue…</p>
      )}

      <ul className="mt-4 space-y-3">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{job.title}</p>
                <p className={`text-xs capitalize ${statusColor(job.status)}`}>
                  {job.status}
                  {job.summary ? ` · ${job.summary}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => runOne(job)}
                disabled={running || job.status === "running"}
                className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs text-cyan-200 disabled:opacity-50"
              >
                Run job
              </button>
            </div>
            <ol className="mt-3 space-y-1.5 border-t border-slate-800/60 pt-3">
              {job.steps.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-2 text-[11px] text-slate-400"
                >
                  <CircleDot
                    className={`mt-0.5 h-3 w-3 shrink-0 ${
                      s.status === "success"
                        ? "text-emerald-400"
                        : s.status === "failed"
                          ? "text-rose-400"
                          : s.status === "running"
                            ? "text-cyan-400"
                            : "text-slate-600"
                    }`}
                  />
                  <span>
                    <span className="text-slate-300">{s.label}</span>
                    {s.detail && ` — ${s.detail}`}
                    {s.error && (
                      <span className="text-rose-300"> · {s.error}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>

      {!loading && jobs.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          No jobs — connect wallet with portfolio drift or arb signals.
        </p>
      )}

      {log.length > 0 && (
        <div className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-[10px] text-slate-500">
          {log.map((line, i) => (
            <p key={`${line}-${i}`}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
