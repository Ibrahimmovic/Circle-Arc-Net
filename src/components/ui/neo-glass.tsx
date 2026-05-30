"use client";

import { cn } from "@/lib/utils";

/** Neo-glass panel — frosted glass + iridescent rim (Figma: Glass / Card / Elevated). */
export function NeoGlass({
  children,
  className,
  glow = "indigo",
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: "indigo" | "cyan" | "violet" | "amber";
  padding?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "neo-glass",
        `neo-glass--${glow}`,
        padding === "sm" && "neo-glass--pad-sm",
        padding === "md" && "neo-glass--pad-md",
        padding === "lg" && "neo-glass--pad-lg",
        padding === "none" && "neo-glass--pad-none",
        className,
      )}
    >
      <div className="neo-glass__sheen" aria-hidden />
      <div className="neo-glass__inner">{children}</div>
    </div>
  );
}
