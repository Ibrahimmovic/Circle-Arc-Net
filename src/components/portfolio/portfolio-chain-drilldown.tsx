"use client";

import { ChevronRight, X } from "lucide-react";
import { formatUsd } from "@/lib/utils";
import { chainIcon } from "@/lib/token-visuals";
import { PortfolioAssetsTable } from "./portfolio-assets-table";
import type { PortfolioAsset } from "@/lib/portfolio-wallet-types";

export function PortfolioChainDrilldown({
  chainId,
  chainLabel,
  valueUsd,
  percent,
  assets,
  onClear,
}: {
  chainId: string;
  chainLabel: string;
  valueUsd: number;
  percent: number;
  assets: PortfolioAsset[];
  onClear: () => void;
}) {
  const icon = chainIcon(chainLabel) ?? chainIcon("Base");

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-4 transition-all duration-300 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <button
            type="button"
            onClick={onClear}
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            All chains
          </button>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="flex items-center gap-2 font-semibold text-white">
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-5 w-5 rounded-full" />
            ) : null}
            {chainLabel}
          </span>
        </nav>
        <button
          type="button"
          onClick={onClear}
          className="flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
          aria-label="Close chain view"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Chain balance
          </p>
          <p className="font-display text-2xl font-bold text-white">
            {formatUsd(valueUsd)}
          </p>
        </div>
        <p className="text-sm text-slate-400">
          {percent.toFixed(1)}% of portfolio · {assets.length} token
          {assets.length === 1 ? "" : "s"}
        </p>
      </div>

      <PortfolioAssetsTable
        assets={assets}
        emptyLabel="No tokens on this chain — try another network or refresh."
      />
    </div>
  );
}
