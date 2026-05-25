"use client";

import { formatPct, formatUsd } from "@/lib/utils";
import { formatQuantityDisplay } from "@/lib/portfolio-display";
import { tokenIcon } from "@/lib/token-visuals";
import type { AggregatedAsset } from "@/lib/portfolio-wallet-types";
import { TrendingDown, TrendingUp } from "lucide-react";

function TokenLogo({ asset }: { asset: AggregatedAsset }) {
  const src = asset.logoUrl ?? tokenIcon(asset.symbol);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-10 w-10 rounded-full bg-slate-800 object-cover ring-1 ring-white/10"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 text-xs font-bold text-white">
      {asset.symbol.slice(0, 3)}
    </div>
  );
}

function balanceLabel(a: AggregatedAsset): string {
  const primary = [...a.holdings].sort((x, y) => y.valueUsd - x.valueUsd)[0];
  if (a.networkCount <= 1 && primary?.balance) {
    return `${primary.balance} ${a.symbol}`;
  }
  if (a.totalBalance != null && a.totalBalance > 0) {
    return `${formatQuantityDisplay(a.totalBalance, a.symbol)} ${a.symbol}`;
  }
  if (primary?.balance) {
    return `${primary.balance} ${a.symbol}`;
  }
  return "—";
}

function networkHint(a: AggregatedAsset): string | null {
  const top = [...a.holdings].sort((x, y) => y.valueUsd - x.valueUsd)[0];
  if (a.networkCount <= 1) return top?.chain ? `On ${top.chain}` : null;
  return `Across ${a.networkCount} chains · largest on ${top?.chain ?? "—"}`;
}

export function PortfolioAggregatedTokens({
  assets,
}: {
  assets: AggregatedAsset[];
}) {
  if (!assets.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">No tokens with balance found.</p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="pb-3 pl-1">Asset</th>
            <th className="pb-3 text-right">Price</th>
            <th className="pb-3 text-right">Balance</th>
            <th className="pb-3 pr-1 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const up = a.change24hPct >= 0;
            const hint = networkHint(a);
            return (
              <tr
                key={a.symbol}
                className="border-b border-slate-800/40 hover:bg-white/[0.03]"
              >
                <td className="py-3.5 pl-1">
                  <div className="flex items-center gap-3">
                    <TokenLogo asset={a} />
                    <div>
                      <p className="font-semibold text-white">{a.symbol}</p>
                      <p className="text-xs text-slate-500">{a.name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono text-xs text-slate-300">
                  {a.priceUsd != null && a.priceUsd > 0
                    ? formatUsd(a.priceUsd)
                    : "—"}
                </td>
                <td className="py-3.5 text-right">
                  <p className="font-mono text-xs text-slate-200">
                    {balanceLabel(a)}
                  </p>
                  {hint && (
                    <p className="text-[10px] text-slate-500">{hint}</p>
                  )}
                </td>
                <td className="py-3.5 pr-1 text-right">
                  <p className="font-mono font-medium text-cyan-100">
                    {formatUsd(a.valueUsd)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {formatPct(a.change24hPct)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
