"use client";

import type { PortfolioDuneAnalytics } from "@/lib/dune";

export function PortfolioDunePanel({
  analytics,
}: {
  analytics?: PortfolioDuneAnalytics;
}) {
  if (!analytics) {
    return (
      <p className="text-sm text-white/50">
        Add <code className="rounded bg-black/30 px-1">DUNE_API_KEY</code> on Vercel
        for on-chain analytics.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50">
        Dune analytics · updated{" "}
        {new Date(analytics.fetchedAt).toLocaleTimeString()}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {analytics.summary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/45">
              {item.label}
            </p>
            <p className="mt-1 font-mono text-sm text-white">{item.value}</p>
          </div>
        ))}
      </div>
      {analytics.rows.length > 0 && (
        <p className="text-[10px] text-white/40">
          {analytics.rows.length} Dune rows loaded
          {analytics.queryId ? ` · query ${analytics.queryId}` : ""}
        </p>
      )}
    </div>
  );
}
