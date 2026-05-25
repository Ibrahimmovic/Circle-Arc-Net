"use client";

import { useEffect, useState } from "react";
import { formatPct, formatUsd } from "@/lib/utils";
import type { CoinMarket } from "@/lib/coingecko";
import { ExternalLink } from "lucide-react";

export function CoinStrip() {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [selected, setSelected] = useState<CoinMarket | null>(null);

  useEffect(() => {
    fetch("/api/markets/coins")
      .then((r) => r.json())
      .then((d) => setCoins(d.coins ?? []))
      .catch(() => setCoins([]));
  }, []);

  if (!coins.length) return null;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Live prices · tap a coin
        </p>
        {selected && (
          <a
            href={`https://www.coingecko.com/en/coins/${selected.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
          >
            {selected.name} on CoinGecko <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto p-2 scrollbar-thin">
        {coins.map((c) => {
          const active = selected?.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(active ? null : c)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                active
                  ? "border-cyan-500/50 bg-cyan-500/15 ring-1 ring-cyan-500/30"
                  : "border-transparent bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/80"
              }`}
            >
              {c.image ? (
                <img src={c.image} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold">
                  {c.symbol.slice(0, 2)}
                </span>
              )}
              <span className="text-xs font-bold text-white">{c.symbol}</span>
              <span
                className={`text-[10px] font-mono ${
                  c.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPct(c.change24h)}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="border-t border-slate-800/60 px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-white">{selected.symbol}</span>{" "}
          {formatUsd(selected.price)}{" "}
          <span className="text-slate-500">· 24h {formatPct(selected.change24h)}</span>
        </div>
      )}
    </div>
  );
}
