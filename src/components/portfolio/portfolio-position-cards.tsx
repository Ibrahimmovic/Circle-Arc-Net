"use client";

import { formatUsd } from "@/lib/utils";
import { Wallet, Layers } from "lucide-react";

export function PortfolioPositionCards({
  walletUsd,
  defiUsd,
  totalUsd,
}: {
  walletUsd: number;
  defiUsd: number;
  totalUsd: number;
}) {
  const walletPct = totalUsd > 0 ? (walletUsd / totalUsd) * 100 : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-slate-900/50 p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Wallet</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatUsd(walletUsd)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {walletPct.toFixed(0)}% of portfolio · on-chain balances
        </p>
      </div>
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-slate-900/50 p-4">
        <div className="flex items-center gap-2 text-violet-300">
          <Layers className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">DeFi</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatUsd(defiUsd)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Staked, deposited & protocol positions (Zerion)
        </p>
      </div>
    </div>
  );
}
