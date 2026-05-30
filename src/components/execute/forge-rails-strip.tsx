"use client";

import { EXECUTION_RAILS } from "@/lib/cross-chain-execution";
import { GlassBadge } from "@/components/ui/glass-ui";

const STATUS: Record<string, string> = {
  live: "text-emerald-300",
  beta: "text-cyan-300",
  planned: "text-white/40",
};

export function ForgeRailsStrip() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXECUTION_RAILS.map((rail) => (
        <span key={rail.id} title={rail.description}>
          <GlassBadge className={STATUS[rail.status]}>
            {rail.label}
            <span className="ml-1 opacity-70">· {rail.status}</span>
          </GlassBadge>
        </span>
      ))}
    </div>
  );
}
