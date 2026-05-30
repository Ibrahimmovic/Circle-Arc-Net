"use client";

import { useState } from "react";
import { resolveTokenLogo, tokenIcon } from "@/lib/token-visuals";
import { cn } from "@/lib/utils";

const GLASS_VARIANTS = ["cyan", "violet", "coral", "emerald"] as const;

export function AssetIcon({
  symbol,
  logoUrl,
  isNative,
  size = 36,
  className = "",
  glass = false,
  glassVariant,
}: {
  symbol: string;
  logoUrl?: string | null;
  isNative?: boolean;
  size?: number;
  className?: string;
  glass?: boolean;
  glassVariant?: (typeof GLASS_VARIANTS)[number];
}) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? undefined
    : resolveTokenLogo(symbol, logoUrl, isNative) ?? tokenIcon(symbol);

  const dim = `${size}px`;
  const variant =
    glassVariant ??
    GLASS_VARIANTS[
      Math.abs(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
        GLASS_VARIANTS.length
    ];

  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full object-cover",
        glass ? "bg-transparent ring-0" : "bg-slate-800 ring-1 ring-white/10",
        className,
      )}
      style={{ width: dim, height: dim }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        glass
          ? "bg-white/10"
          : "bg-gradient-to-br from-cyan-500/30 to-violet-600/30 ring-1 ring-white/10",
        className,
      )}
      style={{ width: dim, height: dim, fontSize: size < 28 ? 9 : 11 }}
    >
      {symbol.slice(0, 3).toUpperCase()}
    </div>
  );

  if (!glass) return inner;

  return (
    <div
      className={cn(
        "exec-token-wrap exec-token-wrap--sm",
        variant === "violet" && "exec-token-wrap--violet",
        variant === "coral" && "exec-token-wrap--coral",
        variant === "emerald" && "exec-token-wrap--emerald",
      )}
      style={{ width: size + 10, height: size + 10 }}
    >
      {inner}
    </div>
  );
}
