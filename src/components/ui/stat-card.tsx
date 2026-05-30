import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { PremiumIcon } from "./premium-icon";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "cyan" | "violet" | "emerald" | "amber";
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend = "neutral",
  variant = "cyan",
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-rose-400"
        : "text-slate-400";

  return (
    <div
      className={cn(
        "glass-panel stat-glow card-shine relative rounded-2xl p-5 transition hover:border-cyan-500/25",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="font-display mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
          {sub && <p className={cn("mt-1 text-sm", trendColor)}>{sub}</p>}
        </div>
        <PremiumIcon icon={icon} variant={variant} size="md" />
      </div>
    </div>
  );
}
