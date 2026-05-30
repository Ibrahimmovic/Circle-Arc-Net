"use client";

import { formatUsd } from "@/lib/utils";
import { Wallet, Layers } from "lucide-react";
import { GlassIconOrb, GlassPanel } from "@/components/ui/glass-ui";

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
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2">
          <GlassIconOrb icon={Wallet} variant="cyan" size="sm" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">
            Wallet
          </span>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatUsd(walletUsd)}
        </p>
        <p className="mt-1 text-xs text-white/55">
          {walletPct.toFixed(0)}% of portfolio · on-chain balances
        </p>
      </GlassPanel>
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2">
          <GlassIconOrb icon={Layers} variant="violet" size="sm" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">
            DeFi
          </span>
        </div>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatUsd(defiUsd)}
        </p>
        <p className="mt-1 text-xs text-white/55">
          Staked, deposited & protocol positions (Zerion)
        </p>
      </GlassPanel>
    </div>
  );
}
