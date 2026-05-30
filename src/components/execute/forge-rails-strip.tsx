"use client";

import { EXECUTION_RAILS } from "@/lib/cross-chain-execution";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  live: "text-emerald-400",
  beta: "text-cyan-400",
  planned: "text-slate-600",
};

export function ForgeRailsStrip() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXECUTION_RAILS.map((rail) => (
        <span
          key={rail.id}
          title={rail.description}
          className={cn(
            "rounded-md border border-slate-800/80 bg-slate-950/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
            STATUS[rail.status],
          )}
        >
          {rail.label}
          <span className="ml-1 opacity-60">· {rail.status}</span>
        </span>
      ))}
    </div>
  );
}
