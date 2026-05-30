"use client";

import { useState } from "react";
import { ExecutionEnginePanel } from "@/components/execute/execution-engine-panel";
import { ExecutionRunnerPanel } from "@/components/execute/execution-runner-panel";
import { CrossChainIntentPanel } from "@/components/execute/cross-chain-intent-panel";
import { cn } from "@/lib/utils";

export function CrossChainExecutionStack() {
  const [sub, setSub] = useState<"intent" | "engine" | "queue">("intent");

  return (
    <div className="space-y-4">
      <div className="luxury-card rounded-2xl p-4 text-sm text-slate-400">
        <p>
          <strong className="text-white">Cross-chain execution</strong> — state
          what you want (Intent) → we route bridge + swap in fewer steps than
          doing it manually. Engine/Queue still auto-run rebalance & arb; Exchange
          handles full Circle CCTP UI.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1">
        {(
          [
            { id: "intent" as const, label: "Intent" },
            { id: "engine" as const, label: "Engine" },
            { id: "queue" as const, label: "Queue" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSub(id)}
            className={cn(
              "min-h-[40px] flex-1 rounded-xl text-xs font-semibold",
              sub === id
                ? "bg-violet-600/40 text-white"
                : "text-slate-400 hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === "intent" && <CrossChainIntentPanel />}
      {sub === "engine" && (
        <ExecutionEnginePanel onOpenQueue={() => setSub("queue")} />
      )}
      {sub === "queue" && <ExecutionRunnerPanel />}
    </div>
  );
}
