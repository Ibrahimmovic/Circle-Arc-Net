"use client";

import { ARC_FEE_COPY } from "@/lib/token-visuals";

export function ArcFeeBadge({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-cyan-200/90">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[9px] font-bold text-cyan-300">
          A
        </span>
        Fees in Arc USDC
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/80 to-violet-950/40 px-3 py-2.5">
      <p className="text-xs font-medium text-cyan-100">{ARC_FEE_COPY}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">
        You will sign a small USDC transfer on Arc before each exchange
      </p>
    </div>
  );
}
