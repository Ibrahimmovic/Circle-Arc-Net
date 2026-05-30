"use client";

import { cn } from "@/lib/utils";
import type { CrossChainRouteOption } from "@/lib/lifi-routes";

const BADGE_LABEL: Record<CrossChainRouteOption["badge"], string> = {
  best: "Top yield",
  fastest: "Quick path",
  direct: "Circle rail",
};

const BADGE_ACCENT: Record<CrossChainRouteOption["badge"], string> = {
  best: "forge-badge--yield",
  fastest: "forge-badge--speed",
  direct: "forge-badge--circle",
};

export function ForgeRouteBadge({ badge }: { badge: CrossChainRouteOption["badge"] }) {
  return (
    <span className={cn("forge-badge", BADGE_ACCENT[badge])}>
      <span className="forge-badge__dot" aria-hidden />
      {BADGE_LABEL[badge]}
    </span>
  );
}
