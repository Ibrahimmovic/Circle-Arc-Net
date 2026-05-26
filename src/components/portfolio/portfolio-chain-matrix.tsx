"use client";

import { useState } from "react";
import { formatUsd, cn } from "@/lib/utils";
import { chainIcon } from "@/lib/token-visuals";
import { ChevronDown, ChevronUp } from "lucide-react";

const VISIBLE = 12;

export function PortfolioChainMatrix({
  chains,
  totalUsd,
  selectedChainId,
  onSelectChain,
}: {
  chains: Array<{ chain: string; chainId: string; valueUsd: number; percent: number }>;
  totalUsd: number;
  selectedChainId?: string | null;
  onSelectChain?: (chainId: string, chainLabel: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!chains.length) {
    return (
      <p className="text-sm text-slate-500">No chain balances yet.</p>
    );
  }

  const visible = expanded ? chains : chains.slice(0, VISIBLE);
  const hidden = chains.length - VISIBLE;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((c) => {
          const icon = chainIcon(c.chain) ?? chainIcon("Base");
          const pct =
            totalUsd > 0
              ? c.percent
              : c.valueUsd > 0
                ? 100
                : 0;
          const selected = selectedChainId === c.chainId;
          const clickable = Boolean(onSelectChain);
          return (
            <button
              key={c.chainId}
              type="button"
              disabled={!clickable}
              onClick={() => onSelectChain?.(c.chainId, c.chain)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition touch-manipulation",
                clickable && "cursor-pointer hover:border-cyan-500/40 hover:bg-slate-900/70",
                selected
                  ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                  : "border-slate-800/80 bg-slate-900/40",
                !clickable && "cursor-default",
              )}
            >
              <div className="flex items-center gap-2">
                {icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white">
                    {c.chain.slice(0, 1)}
                  </span>
                )}
                <span className="truncate text-xs font-semibold text-slate-200">
                  {c.chain}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold text-white">
                {formatUsd(c.valueUsd)}
              </p>
              <p className="text-[10px] text-slate-500">{pct.toFixed(0)}%</p>
            </button>
          );
        })}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Show fewer chains
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Unfold {hidden} more chains
            </>
          )}
        </button>
      )}
    </div>
  );
}
