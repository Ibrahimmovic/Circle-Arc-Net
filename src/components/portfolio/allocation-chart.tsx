"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { ChainAllocation } from "@/lib/types";
import { formatUsd } from "@/lib/utils";

const COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
];

export function AllocationChart({ data }: { data: ChainAllocation[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        No chain data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.chain,
    value: d.valueUsd ?? 0,
    percent: d.percent ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={64}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 12,
          }}
          formatter={(v) => formatUsd(Number(v ?? 0))}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
