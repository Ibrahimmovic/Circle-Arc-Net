"use client";

import { formatUsd, formatPct } from "@/lib/utils";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "from-blue-500/30 to-blue-600/10",
  Base: "from-blue-400/30 to-indigo-600/10",
  Polygon: "from-purple-500/30 to-violet-600/10",
  Arbitrum: "from-sky-500/30 to-cyan-600/10",
  Optimism: "from-red-500/20 to-rose-600/10",
  Avalanche: "from-rose-500/30 to-red-600/10",
  Arc: "from-cyan-500/40 to-emerald-600/10",
};

export function ChainBalanceGrid({
  chains,
}: {
  chains: Array<{ chain: string; valueUsd: number; percent: number }>;
}) {
  if (!chains.length) {
    return (
      <p className="text-sm text-slate-500">No per-chain breakdown yet — fund wallet to scan.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {chains.map((c) => (
        <div
          key={c.chain}
          className={`rounded-2xl border border-slate-800/80 bg-gradient-to-br p-4 ${
            CHAIN_COLORS[c.chain] ?? "from-slate-800/50 to-slate-900/30"
          }`}
        >
          <p className="text-sm font-semibold text-white">{c.chain}</p>
          <p className="mt-2 font-mono text-xl font-bold text-cyan-100">
            {formatUsd(c.valueUsd)}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
              style={{ width: `${Math.min(100, c.percent)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{c.percent.toFixed(1)}% of wallet</p>
        </div>
      ))}
    </div>
  );
}
