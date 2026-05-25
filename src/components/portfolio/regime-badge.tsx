import { cn } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";
import { TrendingUp, Minus, Shield } from "lucide-react";

const config: Record<
  MarketRegime,
  { label: string; icon: typeof TrendingUp; className: string }
> = {
  "risk-on": {
    label: "Risk-On",
    icon: TrendingUp,
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  "risk-off": {
    label: "Risk-Off",
    icon: Shield,
    className: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
};

export function RegimeBadge({ regime }: { regime: MarketRegime }) {
  const { label, icon: Icon, className } = config[regime];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
