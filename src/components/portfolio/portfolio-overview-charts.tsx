"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AllocationChart } from "./allocation-chart";
import { cn, formatPct, formatUsd } from "@/lib/utils";
import type { PortfolioChart } from "@/lib/portfolio-wallet-types";
import type { ChartPeriod } from "@/lib/chart-period";

const PERIODS: { id: ChartPeriod; label: string }[] = [
  { id: "day", label: "1D" },
  { id: "week", label: "1W" },
  { id: "month", label: "1M" },
  { id: "3months", label: "3M" },
  { id: "year", label: "1Y" },
];

function periodLabel(period: string): string {
  return PERIODS.find((p) => p.id === period)?.label ?? period;
}

export function PortfolioOverviewCharts({
  chains,
  portfolioChart,
  change24hPct,
  change24hUsd,
  chartPeriod,
  onChartPeriodChange,
}: {
  chains: Array<{ chain: string; valueUsd: number; percent: number }>;
  portfolioChart?: PortfolioChart;
  change24hPct: number;
  change24hUsd?: number;
  chartPeriod: ChartPeriod;
  onChartPeriodChange: (p: ChartPeriod) => void;
}) {
  const lineData = useMemo(() => {
    const pts = portfolioChart?.points ?? [];
    return pts.map((p) => ({
      t: p.t * 1000,
      v: Number(p.v.toFixed(2)),
      label: new Date(p.t * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [portfolioChart?.points]);

  const pnlUsd = portfolioChart?.pnlUsd ?? change24hUsd ?? 0;
  const pnlPct = portfolioChart?.pnlPct ?? change24hPct;
  const up = pnlUsd >= 0;
  const stroke = up ? "#22d3ee" : "#fb7185";
  const chartSource = portfolioChart?.source ?? "estimated";

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
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-white">Portfolio value</h4>
            <p className="text-[10px] text-slate-500">
              {chartSource === "zerion"
                ? `Zerion balance chart · ${periodLabel(chartPeriod)}`
                : `Estimated from net worth · set ZERION_API_KEY on Vercel`}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/80 p-0.5">
            {PERIODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChartPeriodChange(id)}
                className={cn(
                  "min-h-[32px] rounded-md px-2.5 text-[10px] font-semibold transition touch-manipulation",
                  chartPeriod === id
                    ? "bg-cyan-500/20 text-cyan-100"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase text-slate-500">
              PnL ({periodLabel(chartPeriod)})
            </p>
            <p
              className={`font-mono font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}
            >
              {pnlUsd >= 0 ? "+" : ""}
              {formatUsd(pnlUsd)} ({formatPct(pnlPct)})
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">24h</p>
            <p
              className={`font-mono font-semibold ${change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {change24hUsd != null
                ? `${change24hUsd >= 0 ? "+" : ""}${formatUsd(change24hUsd)}`
                : ""}{" "}
              ({formatPct(change24hPct)})
            </p>
          </div>
        </div>

        {lineData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioValueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 9 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                hide
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => [formatUsd(Number(v ?? 0)), "Net worth"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#portfolioValueArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
            Connect wallet on mainnet with Zerion key for history
          </div>
        )}
      </div>
    </div>
  );
}
