"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AllocationChart } from "./allocation-chart";
import { formatUsd } from "@/lib/utils";

export function PortfolioOverviewCharts({
  chains,
  sparkline,
  change24hPct,
}: {
  chains: Array<{ chain: string; valueUsd: number; percent: number }>;
  sparkline: number[];
  change24hPct: number;
}) {
  const lineData = sparkline.map((v, i) => ({
    i,
    v: Number(v.toFixed(2)),
  }));
  const up = change24hPct >= 0;
  const stroke = up ? "#22d3ee" : "#fb7185";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="luxury-card rounded-2xl p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-white">Allocation by chain</h4>
        <p className="mb-2 text-[10px] text-slate-500">
          Click a chain below to see tokens on that network
        </p>
        <AllocationChart
          data={chains.map((c) => ({
            chain: c.chain,
            valueUsd: c.valueUsd,
            percent: c.percent,
          }))}
        />
      </div>

      <div className="luxury-card rounded-2xl p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-white">Market context</h4>
        <p className="mb-3 text-[10px] text-slate-500">
          ETH macro trend (7d) — portfolio history requires Zerion Pro
        </p>
        {lineData.length > 4 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis
                hide
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "ETH"]}
                labelFormatter={() => ""}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#portfolioArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
            Loading market trend…
          </div>
        )}
      </div>
    </div>
  );
}
