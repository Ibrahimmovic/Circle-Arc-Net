"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Repeat,
  FileCode,
} from "lucide-react";
import { formatUsd, shortenAddress } from "@/lib/utils";
import type { PortfolioActivity } from "@/lib/portfolio-wallet-types";
import { txExplorerLinkForZerionChain } from "@/lib/portfolio-explorers";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 86_400_000) {
      const hrs = Math.floor(diff / 3_600_000);
      if (hrs < 1) return `${Math.floor(diff / 60_000)}m ago`;
      return `${hrs}h ago`;
    }
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

function ActivityIcon({ tx }: { tx: PortfolioActivity }) {
  const t = (tx.displayType ?? tx.type).toLowerCase();
  const cls = "h-4 w-4";
  if (t.includes("receive") || tx.direction === "in") {
    return <ArrowDownLeft className={`${cls} text-emerald-400`} />;
  }
  if (t.includes("send") || tx.direction === "out") {
    return <ArrowUpRight className={`${cls} text-rose-400`} />;
  }
  if (t.includes("trade") || t.includes("swap")) {
    return <Repeat className={`${cls} text-violet-400`} />;
  }
  return <FileCode className={`${cls} text-cyan-400`} />;
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
        const isIn = tx.direction === "in" || (tx.displayType ?? "").includes("Receive");
        const amountStr =
          tx.amount && tx.assetSymbol
            ? `${isIn ? "+" : "-"}${tx.amount} ${tx.assetSymbol}`
            : null;

        return (
          <li
            key={tx.id}
            className="flex flex-wrap items-start gap-3 py-3.5 first:pt-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-slate-700/80">
              <ActivityIcon tx={tx} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {tx.displayType ?? tx.type}
                </span>
                {tx.isSpam && (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200">
                    scam
                  </span>
                )}
                <span className="text-xs text-slate-500">{tx.chain}</span>
              </div>
              <p className="mt-0.5 text-sm text-slate-300">{tx.label}</p>
              {tx.appName && (
                <p className="text-xs text-slate-500">via {tx.appName}</p>
              )}
              <p className="mt-0.5 text-[10px] text-slate-600">
                {formatTime(tx.timestamp)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {amountStr && (
                <p
                  className={`font-mono text-sm font-medium ${
                    isIn ? "text-emerald-400" : "text-slate-200"
                  }`}
                >
                  {amountStr}
                </p>
              )}
              {tx.valueUsd != null && tx.valueUsd > 0 && (
                <p className="font-mono text-xs text-slate-500">
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
