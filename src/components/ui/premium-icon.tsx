"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const VARIANTS = {
  cyan: "premium-icon--cyan",
  violet: "premium-icon--violet",
  emerald: "premium-icon--emerald",
  amber: "premium-icon--amber",
} as const;

export function PremiumIcon({
  icon: Icon,
  variant = "cyan",
  size = "md",
  className,
  pulse,
}: {
  icon: LucideIcon;
  variant?: keyof typeof VARIANTS;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        "premium-icon",
        VARIANTS[variant],
        size === "sm" && "premium-icon--sm",
        size === "lg" && "premium-icon--lg",
        size === "xl" && "premium-icon--xl",
        pulse && "premium-icon--pulse",
        className,
      )}
    >
      <Icon className="relative z-10" strokeWidth={2} />
    </div>
  );
}
