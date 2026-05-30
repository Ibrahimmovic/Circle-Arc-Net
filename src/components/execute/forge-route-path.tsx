"use client";

import { cn } from "@/lib/utils";

/** Agora Forge route connector — arc mesh between source and destination. */
export function ForgeRoutePath({
  fromLabel,
  toLabel,
  loading,
  className,
}: {
  fromLabel: string;
  toLabel: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("forge-route-path", loading && "forge-route-path--active", className)}>
      <span className="forge-route-path__node truncate">{fromLabel}</span>
      <svg
        className="forge-route-path__svg"
        viewBox="0 0 120 32"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="forge-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path
          d="M4 16 H44"
          className="forge-route-path__line"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M44 16 Q60 4 76 16 T108 16"
          className="forge-route-path__arc"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="60" cy="16" r="3" className="forge-route-path__hub" />
      </svg>
      <span className="forge-route-path__node truncate">{toLabel}</span>
    </div>
  );
}
