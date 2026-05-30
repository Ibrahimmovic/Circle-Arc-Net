"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPct } from "@/lib/utils";
import { GlassBadge } from "@/components/ui/glass-ui";
import { cn } from "@/lib/utils";

export function MarketTicker({ variant = "default" }: { variant?: "default" | "glass" }) {
  const [data, setData] = useState<{
    ethChange24h: number;
    btcChange24h: number;
    macroRegime?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((json) => {
        const m = json.markets ?? json;
        if (m?.ethChange24h != null) {
          setData({
            ethChange24h: Number(m.ethChange24h) || 0,
            btcChange24h: Number(m.btcChange24h) || 0,
            macroRegime: json.macroRegime,
          });
        }
      })
      .catch(() => null);
  }, []);

  if (!data) return null;

  const isGlass = variant === "glass";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 px-4 py-2.5 text-xs",
        isGlass
          ? "home-market-macro border-b border-white/8 bg-white/[0.03]"
          : "rounded-xl border border-slate-800/60 bg-slate-950/50",
      )}
    >
      <span className={isGlass ? "text-white/45" : "text-slate-500"}>
        Live macro · CoinGecko
      </span>
      <TickerItem label="ETH" change={data.ethChange24h} glass={isGlass} />
      <TickerItem label="BTC" change={data.btcChange24h} glass={isGlass} />
      {data.macroRegime && (
        isGlass ? (
          <GlassBadge>{data.macroRegime.replace("-", " ")}</GlassBadge>
        ) : (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">
            {data.macroRegime.replace("-", " ")}
          </span>
        )
      )}
    </div>
  );
}

function TickerItem({
  label,
  change,
  glass,
}: {
  label: string;
  change: number;
  glass?: boolean;
}) {
  const up = change >= 0;
  return (
    <span
      className={cn(
        "flex items-center gap-1 font-mono",
        glass ? "text-white/80" : "text-slate-300",
      )}
    >
      {label}
      {up ? (
        <TrendingUp className="h-3 w-3 text-emerald-300" />
      ) : (
        <TrendingDown className="h-3 w-3 text-rose-300" />
      )}
      <span className={up ? "text-emerald-300" : "text-rose-300"}>
        {formatPct(change)}
      </span>
    </span>
  );
}
