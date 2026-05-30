"use client";

import { Clock, Fuel, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrossChainRouteOption } from "@/lib/lifi-routes";
import { formatUnits } from "viem";

const BADGE: Record<
  CrossChainRouteOption["badge"],
  { label: string; className: string; icon: typeof Sparkles }
> = {
  best: {
    label: "Best return",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    icon: Sparkles,
  },
  fastest: {
    label: "Fastest",
    className: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
    icon: Zap,
  },
  direct: {
    label: "Direct",
    className: "bg-violet-500/20 text-violet-200 border-violet-500/40",
    icon: Sparkles,
  },
};

export function CrossChainRouteCard({
  route,
  toSymbol,
  toDecimals,
  selected,
  onSelect,
}: {
  route: CrossChainRouteOption;
  toSymbol: string;
  toDecimals: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = BADGE[route.badge];
  const Icon = meta.icon;

  let amountLabel = "—";
  if (route.toAmount) {
    try {
      const formatted = formatUnits(BigInt(route.toAmount), toDecimals);
      amountLabel = `${Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toSymbol}`;
    } catch {
      amountLabel = route.toAmount;
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!route.executable}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all touch-manipulation",
        selected
          ? "border-violet-400/60 bg-violet-500/15 ring-2 ring-violet-400/30"
          : "border-slate-700/80 bg-slate-950/60 hover:border-slate-600",
        !route.executable && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            meta.className,
          )}
        >
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <span className="text-xs font-semibold text-slate-400">{route.provider}</span>
      </div>
      <p className="font-mono text-lg font-semibold text-white">{amountLabel}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        {route.gasUsd && (
          <span className="inline-flex items-center gap-1">
            <Fuel className="h-3 w-3" />
            ~${Number(route.gasUsd).toFixed(2)} gas
          </span>
        )}
        {route.durationSec != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />~{Math.max(1, Math.round(route.durationSec))}s
          </span>
        )}
      </div>
      {route.hint && <p className="mt-2 text-xs text-slate-400">{route.hint}</p>}
    </button>
  );
}
