"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/ui/sparkline";
import { ArrowRight } from "lucide-react";

export function RouteCard({
  fromLabel,
  toLabel,
  amount,
  token = "USDC",
}: {
  fromLabel: string;
  toLabel: string;
  amount?: string;
  token?: string;
}) {
  const [sparkline, setSparkline] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/markets/sparkline")
      .then((r) => r.json())
      .then((d) => setSparkline(d.sparkline ?? []))
      .catch(() => setSparkline([]));
  }, []);

  return (
    <div className="luxury-card mb-4 overflow-hidden rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200">
            {fromLabel}
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
          <div className="rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-200">
            {toLabel}
          </div>
        </div>
        {amount && (
          <p className="font-mono text-sm font-semibold text-white">
            {amount} {token}
          </p>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-slate-800/80 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Live macro · CoinGecko
        </p>
        {sparkline.length > 0 && <Sparkline data={sparkline} width={140} height={32} />}
      </div>
    </div>
  );
}
