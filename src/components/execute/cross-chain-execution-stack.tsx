"use client";

import { useState } from "react";
import { ExecutionEnginePanel } from "@/components/execute/execution-engine-panel";
import { ExecutionRunnerPanel } from "@/components/execute/execution-runner-panel";
import { cn } from "@/lib/utils";

export function CrossChainExecutionStack() {
  const [sub, setSub] = useState<"engine" | "queue">("engine");

  return (
    <div className="space-y-4">
      <div className="luxury-card rounded-2xl p-4 text-sm text-slate-400">
        <p>
          <strong className="text-white">Cross-chain execution system</strong>{" "}
          — plan (engine) → compile jobs (queue) → execute via Exchange tab
          (CCTP bridge / swap). Arb + rebalance auto-queue; LiFi + intents on
          roadmap.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1">
        {(
          [
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

      {sub === "engine" ? (
        <ExecutionEnginePanel onOpenQueue={() => setSub("queue")} />
      ) : (
        <ExecutionRunnerPanel />
      )}
    </div>
  );
}
