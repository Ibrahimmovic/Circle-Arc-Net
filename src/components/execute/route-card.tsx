"use client";

import { ArrowRight } from "lucide-react";

/** Compact route row — no large chart (keeps bridge/swap UI clean). */
export function RouteCard({
  fromLabel,
  toLabel,
  amount,
  token = "USDC",
}: {
  fromLabel: string;
  toLabel: string;
  amount?: string;
  token?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-2.5">
      <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-100">
        {fromLabel}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-violet-400" />
      <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-100">
        {toLabel}
      </span>
      {amount && (
        <span className="ml-auto font-mono text-xs font-semibold text-white">
          {amount} {token}
        </span>
      )}
    </div>
  );
}
