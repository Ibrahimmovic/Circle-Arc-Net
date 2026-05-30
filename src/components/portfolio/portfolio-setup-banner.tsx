"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { PortfolioProviderStatus } from "@/lib/portfolio-providers";
import { PortfolioProviderMatrix } from "./portfolio-provider-matrix";

export function PortfolioSetupBanner({
  zerionAvailable,
  apis,
  dataSourceLabel,
  zerionStatus,
  zerionMessage,
}: {
  zerionAvailable: boolean;
  dataSourceLabel?: string;
  apis?: PortfolioProviderStatus;
  zerionStatus?: "ok" | "error" | "off";
  zerionMessage?: string;
}) {
  const zerionKeySet = apis?.zerion;
  const alchemyOn = apis?.alchemy;
  const showWarning = !zerionAvailable && zerionKeySet;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        zerionAvailable || alchemyOn
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : showWarning
            ? "border-rose-500/35 bg-rose-500/10 text-rose-50"
            : "border-amber-500/35 bg-amber-500/10 text-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        {zerionAvailable || alchemyOn ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-medium">
              {zerionAvailable
                ? "Live portfolio data connected"
                : alchemyOn
                  ? "Portfolio running on Alchemy + Covalent backup"
                  : showWarning
                    ? "Zerion rate-limited — using Covalent + CoinGecko"
                    : "Configure API keys on Vercel for full portfolio stack"}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {dataSourceLabel ?? "Loading…"}
              {zerionMessage && (
                <span className="mt-1 block text-rose-200/90">{zerionMessage}</span>
              )}
            </p>
          </div>

          <PortfolioProviderMatrix apis={apis} />
        </div>
      </div>
    </div>
  );
}
