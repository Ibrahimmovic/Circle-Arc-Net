"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export function PortfolioSetupBanner({
  zerionAvailable,
  apis,
  dataSourceLabel,
}: {
  zerionAvailable: boolean;
  dataSourceLabel?: string;
  apis?: { zerion: boolean; goldrush: boolean; coingecko: boolean };
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        zerionAvailable
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-amber-500/35 bg-amber-500/10 text-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        {zerionAvailable ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {zerionAvailable
              ? "Live portfolio data connected"
              : "Limited mode — add Zerion for full DeBank/Zerion experience"}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {dataSourceLabel ?? "Loading…"}
            {!zerionAvailable && (
              <>
                {" "}
                · Set <code className="rounded bg-black/30 px-1">ZERION_API_KEY</code> on
                Vercel for transactions, NFTs, and exact net worth.
              </>
            )}
          </p>
          {apis && (
            <p className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide opacity-80">
              <span>Zerion {apis.zerion ? "on" : "off"}</span>
              <span>GoldRush {apis.goldrush ? "on" : "off"}</span>
              <span>CoinGecko {apis.coingecko ? "on" : "off"}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
