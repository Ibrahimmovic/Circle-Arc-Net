"use client";

import { useEffect, useState } from "react";
import { formatPct, formatUsd } from "@/lib/utils";
import type { CoinMarket } from "@/lib/coingecko";
import { ExternalLink } from "lucide-react";
import { LiquidGlassTokenOrb } from "@/components/ui/glass-ui";
import { cn } from "@/lib/utils";

export function CoinStrip({ variant = "default" }: { variant?: "default" | "glass" }) {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [selected, setSelected] = useState<CoinMarket | null>(null);

  useEffect(() => {
    fetch("/api/markets/coins")
      .then((r) => r.json())
      .then((d) => setCoins(d.coins ?? []))
      .catch(() => setCoins([]));
  }, []);

  if (!coins.length) return null;

  const isGlass = variant === "glass";

  return (
    <div className={cn(isGlass ? "home-market-coins" : "rounded-xl border border-slate-800/80 bg-slate-950/70")}>
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2.5",
          isGlass ? "border-b border-white/8" : "border-b border-slate-800/60",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            isGlass ? "text-white/45" : "text-slate-500",
          )}
        >
          Live prices · tap a coin
        </p>
        {selected && (
          <a
            href={`https://www.coingecko.com/en/coins/${selected.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 text-[10px]",
              isGlass ? "text-cyan-200/80 hover:text-cyan-100" : "text-cyan-400 hover:text-cyan-300",
            )}
          >
            {selected.name} on CoinGecko <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="home-market-coins__scroll flex gap-2 overflow-x-auto p-3 scrollbar-thin">
        {coins.map((c, i) => {
          const active = selected?.id === c.id;
          const orbVariant = (["cyan", "violet", "coral", "emerald"] as const)[i % 4];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(active ? null : c)}
              className={cn(
                "liquid-glass-coin shrink-0",
                active && "liquid-glass-coin--active",
              )}
            >
              <LiquidGlassTokenOrb variant={orbVariant} size={36}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white">
                    {c.symbol.slice(0, 2)}
                  </span>
                )}
              </LiquidGlassTokenOrb>
              <span className="liquid-glass-coin__symbol">{c.symbol}</span>
              <span
                className={cn(
                  "liquid-glass-coin__change font-mono",
                  c.change24h >= 0 ? "text-emerald-300" : "text-rose-300",
                )}
              >
                {formatPct(c.change24h)}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          className={cn(
            "px-3 py-2.5 text-xs",
            isGlass
              ? "border-t border-white/8 bg-white/[0.03] text-white/70"
              : "border-t border-slate-800/60 text-slate-300",
          )}
        >
          <span className="font-semibold text-white">{selected.symbol}</span>{" "}
          {formatUsd(selected.price)}{" "}
          <span className={isGlass ? "text-white/40" : "text-slate-500"}>
            · 24h {formatPct(selected.change24h)}
          </span>
        </div>
      )}
    </div>
  );
}
