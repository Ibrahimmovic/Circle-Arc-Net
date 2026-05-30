"use client";

import { cn } from "@/lib/utils";
import type { CrossChainRouteOption } from "@/lib/lifi-routes";
import { formatUnits } from "viem";
import { ForgeRouteBadge } from "@/components/execute/forge-route-badge";

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
  let amountLabel = "—";
  if (route.toAmount) {
    try {
      const formatted = formatUnits(BigInt(route.toAmount), toDecimals);
      amountLabel = `${Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toSymbol}`;
    } catch {
      amountLabel = route.toAmount;
    }
  }

  const gas =
    route.gasUsd != null && !Number.isNaN(Number(route.gasUsd))
      ? `~$${Number(route.gasUsd).toFixed(2)}`
      : null;
  const eta =
    route.durationSec != null
      ? `~${Math.max(1, Math.round(route.durationSec))}s`
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!route.executable}
      className={cn(
        "forge-route-card w-full text-left touch-manipulation",
        selected && "forge-route-card--selected",
        !route.executable && "opacity-45 cursor-not-allowed",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <ForgeRouteBadge badge={route.badge} />
        <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {route.provider}
        </span>
      </div>
      <p className="font-mono text-xl font-semibold tracking-tight text-white">
        {amountLabel}
      </p>
      {(gas || eta) && (
        <dl className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
          {gas && (
            <div>
              <dt className="uppercase tracking-wide">Est. gas</dt>
              <dd className="mt-0.5 font-medium text-slate-300">{gas}</dd>
            </div>
          )}
          {eta && (
            <div>
              <dt className="uppercase tracking-wide">Est. time</dt>
              <dd className="mt-0.5 font-medium text-slate-300">{eta}</dd>
            </div>
          )}
        </dl>
      )}
      {route.hint && (
        <p className="mt-2 border-t border-slate-800/80 pt-2 text-xs leading-relaxed text-slate-400">
          {route.hint}
        </p>
      )}
    </button>
  );
}
