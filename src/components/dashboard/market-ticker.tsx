"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPct } from "@/lib/utils";

export function MarketTicker() {
  const [data, setData] = useState<{
    ethChange24h: number;
    btcChange24h: number;
    macroRegime?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-2 text-xs">
      <span className="text-slate-500">Live macro · CoinGecko</span>
      <TickerItem label="ETH" change={data.ethChange24h} />
      <TickerItem label="BTC" change={data.btcChange24h} />
      {data.macroRegime && (
        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">
          {data.macroRegime.replace("-", " ")}
        </span>
      )}
    </div>
  );
}

function TickerItem({ label, change }: { label: string; change: number }) {
  const up = change >= 0;
  return (
    <span className="flex items-center gap-1 font-mono text-slate-300">
      {label}
      {up ? (
        <TrendingUp className="h-3 w-3 text-emerald-400" />
      ) : (
        <TrendingDown className="h-3 w-3 text-rose-400" />
      )}
      <span className={up ? "text-emerald-400" : "text-rose-400"}>
        {formatPct(change)}
      </span>
    </span>
  );
}
