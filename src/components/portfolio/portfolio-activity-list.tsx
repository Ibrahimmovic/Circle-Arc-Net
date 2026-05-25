"use client";

import { ExternalLink } from "lucide-react";
import { formatUsd, shortenAddress } from "@/lib/utils";
import type { PortfolioActivity } from "@/lib/portfolio-wallet-types";
import { txExplorerLinkForZerionChain } from "@/lib/portfolio-explorers";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PortfolioActivityList({
  items,
  emptyLabel,
}: {
  items: PortfolioActivity[];
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-slate-800/60">
      {items.map((tx) => {
        const href = txExplorerLinkForZerionChain(tx.chainId ?? tx.chain, tx.hash);
        return (
          <li
            key={tx.id}
            className="flex flex-wrap items-start justify-between gap-3 py-3.5 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-200">
                  {tx.type}
                </span>
                {tx.isSpam && (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                    flagged
                  </span>
                )}
                <span className="text-xs text-slate-500">{tx.chain}</span>
              </div>
              <p className="mt-1 font-medium text-white">{tx.label}</p>
              {tx.appName && (
                <p className="text-xs text-slate-500">via {tx.appName}</p>
              )}
              <p className="mt-0.5 text-[10px] text-slate-600">
                {formatTime(tx.timestamp)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {tx.valueUsd != null && tx.valueUsd > 0 && (
                <p className="font-mono text-sm text-cyan-100">
                  {formatUsd(tx.valueUsd)}
                </p>
              )}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  {shortenAddress(tx.hash)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-mono text-[11px] text-slate-500">
                  {shortenAddress(tx.hash)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
