"use client";

import { formatPct, formatUsd } from "@/lib/utils";
import { tokenIcon } from "@/lib/token-visuals";
import type { PortfolioAsset } from "@/lib/portfolio-wallet-types";
import { TrendingDown, TrendingUp, ShieldAlert, AlertTriangle } from "lucide-react";

function AssetIcon({ asset }: { asset: PortfolioAsset }) {
  const src = asset.logoUrl ?? tokenIcon(asset.symbol);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full bg-slate-800 object-cover ring-1 ring-white/10"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 text-xs font-bold text-white ring-1 ring-white/10">
      {asset.symbol.slice(0, 3)}
    </div>
  );
}

export function PortfolioAssetsTable({
  assets,
  emptyLabel = "No tokens found",
}: {
  assets: PortfolioAsset[];
  emptyLabel?: string;
}) {
  if (!assets.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="pb-3 pl-1">Asset</th>
            <th className="pb-3">Chain</th>
            <th className="pb-3 text-right">Price</th>
            <th className="pb-3 text-right">Balance</th>
            <th className="pb-3 text-right">24h</th>
            <th className="pb-3 pr-1 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const up = a.change24hPct >= 0;
            return (
              <tr
                key={a.id}
                className="border-b border-slate-800/40 transition hover:bg-white/[0.03]"
              >
                <td className="py-3.5 pl-1">
                  <div className="flex items-center gap-3">
                    <AssetIcon asset={a} />
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{a.symbol}</p>
                      <p className="truncate text-xs text-slate-500">{a.name}</p>
                    </div>
                    {a.isSpam && (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    )}
                    {a.unverified && !a.isSpam && (
                      <span title="No USD price">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-slate-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 text-slate-400">{a.chain}</td>
                <td className="py-3.5 text-right font-mono text-xs text-slate-300">
                  {a.priceUsd != null && a.priceUsd > 0
                    ? formatUsd(a.priceUsd)
                    : "—"}
                </td>
                <td className="py-3.5 text-right font-mono text-xs text-slate-200">
                  {a.balance ? `${a.balance} ${a.symbol}` : "—"}
                </td>
                <td className="py-3.5 text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPct(a.change24hPct)}
                  </span>
                </td>
                <td className="py-3.5 pr-1 text-right font-mono font-medium text-cyan-100">
                  {formatUsd(a.valueUsd)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
