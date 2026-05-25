import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend = "neutral",
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-slate-400";

  return (
    <div className={cn("glass-panel rounded-2xl p-5 glow-border", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>
          {sub && (
            <p className={cn("mt-1 text-sm", trendColor)}>{sub}</p>
          )}
        </div>
        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
