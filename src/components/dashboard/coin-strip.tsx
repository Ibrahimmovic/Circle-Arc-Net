"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/ui/sparkline";
import { formatPct } from "@/lib/utils";
import type { CoinMarket } from "@/lib/coingecko";

export function CoinStrip() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);

  useEffect(() => {
    fetch("/api/markets/coins")
      .then((r) => r.json())
      .then((d) => setCoins(d.coins ?? []))
      .catch(() => setCoins([]));
  }, []);

  if (!coins.length) return null;

  return (
    <div className="luxury-card overflow-hidden rounded-2xl">
      <div className="border-b border-slate-800/80 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Markets · CoinGecko
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto p-3 scrollbar-thin">
        {coins.map((c) => (
          <div
            key={c.id}
            className="flex min-w-[140px] shrink-0 flex-col gap-2 rounded-xl border border-slate-800/60 bg-slate-950/60 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              {c.image ? (
                <img src={c.image} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold">
                  {c.symbol.slice(0, 2)}
                </span>
              )}
              <div>
                <p className="text-xs font-bold text-white">{c.symbol}</p>
                <p
                  className={`text-[10px] font-mono ${
                    c.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatPct(c.change24h)}
                </p>
              </div>
            </div>
            {c.sparkline.length > 4 && (
              <Sparkline
                data={c.sparkline}
                width={110}
                height={28}
                positive={c.change24h >= 0}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
