"use client";

import { PORTFOLIO_PROVIDER_MATRIX } from "@/lib/portfolio-providers";
import type { PortfolioProviderStatus } from "@/lib/portfolio-providers";
import { cn } from "@/lib/utils";

const STATUS_KEY: Record<string, keyof PortfolioProviderStatus> = {
  Zerion: "zerion",
  Alchemy: "alchemy",
  GoPlus: "goplus",
  CoinGecko: "coingecko",
  Dune: "dune",
  Covalent: "covalent",
};

export function PortfolioProviderMatrix({
  apis,
  className,
}: {
  apis?: PortfolioProviderStatus;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-white/10 bg-black/20",
        className,
      )}
    >
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
            <th className="px-3 py-2 font-semibold">Feature</th>
            <th className="px-3 py-2 font-semibold">API</th>
            <th className="px-3 py-2 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {PORTFOLIO_PROVIDER_MATRIX.map((row) => {
            const key = STATUS_KEY[row.api];
            const on = key && apis ? apis[key] : row.api === "CoinGecko";
            return (
              <tr key={row.feature} className="border-b border-white/5 last:border-0">
                <td className="px-3 py-2.5 text-white/85">{row.feature}</td>
                <td className="px-3 py-2.5 font-medium text-cyan-200/90">{row.api}</td>
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      on
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-white/8 text-white/45",
                    )}
                  >
                    {on ? "live" : "off"}
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
