"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { figmaSpringSnappy } from "@/design/motion-presets";

/** Theme 1 — frosted cinematic panel */
export function GlassPanel({
  children,
  className,
  strong,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-panel",
        strong && "glass-panel--strong",
        className,
      )}
    >
      <div className="glass-panel__shine" aria-hidden />
      {children}
    </div>
  );
}

/** Theme 2 — liquid glass pill button */
export function LiquidGlassButton({
  href,
  onClick,
  children,
  variant = "primary",
  className,
  type = "button",
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = cn(
    "liquid-glass-btn",
    variant === "primary" && "liquid-glass-btn--primary",
    variant === "secondary" && "liquid-glass-btn--secondary",
    variant === "ghost" && "liquid-glass-btn--ghost",
    className,
  );

  const inner = (
    <>
      <span className="liquid-glass-btn__core" aria-hidden />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={figmaSpringSnappy}>
        <Link href={href} className={cls}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cls}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={figmaSpringSnappy}
    >
      {inner}
    </motion.button>
  );
}

/** Theme 2 — pill badge on glass */
export function GlassBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("glass-badge", className)}>{children}</span>;
}

/** Theme 2 — circular liquid-glass icon orb */
export function GlassIconOrb({
  icon: Icon,
  variant = "cyan",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  variant?: "cyan" | "violet" | "coral" | "emerald";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-icon-orb",
        variant === "cyan" && "glass-icon-orb--cyan",
        variant === "violet" && "glass-icon-orb--violet",
        variant === "coral" && "glass-icon-orb--coral",
        variant === "emerald" && "glass-icon-orb--emerald",
        size === "sm" && "glass-icon-orb--sm",
        size === "lg" && "glass-icon-orb--lg",
        className,
      )}
    >
      <span className="glass-icon-orb__rim" aria-hidden />
      <span className="glass-icon-orb__core" aria-hidden />
      <Icon className="relative z-10" strokeWidth={1.75} />
    </div>
  );
}

/** Theme 2 — liquid glass shell for token / coin icons */
export function LiquidGlassTokenOrb({
  children,
  variant = "cyan",
  size = 40,
  className,
}: {
  children: React.ReactNode;
  variant?: "cyan" | "violet" | "coral" | "emerald";
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "liquid-token-orb",
        variant === "cyan" && "liquid-token-orb--cyan",
        variant === "violet" && "liquid-token-orb--violet",
        variant === "coral" && "liquid-token-orb--coral",
        variant === "emerald" && "liquid-token-orb--emerald",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="liquid-token-orb__rim" aria-hidden />
      <span className="liquid-token-orb__core" aria-hidden />
      <div className="liquid-token-orb__content">{children}</div>
    </div>
  );
}
