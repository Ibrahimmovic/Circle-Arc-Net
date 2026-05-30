"use client";

import { tokenIcon, chainIcon } from "@/lib/token-visuals";
import { LiquidGlassTokenOrb } from "@/components/ui/glass-ui";

export function TokenAvatar({
  symbol,
  chainKey,
  size = 40,
  glass = false,
  glassVariant = "cyan",
}: {
  symbol: string;
  chainKey?: string;
  size?: number;
  glass?: boolean;
  glassVariant?: "cyan" | "violet" | "coral" | "emerald";
}) {
  const src = tokenIcon(symbol);
  const badge = chainKey ? chainIcon(chainKey) : undefined;
  const s = size;
  const badgeS = Math.round(size * 0.38);

  const inner = (
    <>
      {src ? (
        <img
          src={src}
          alt=""
          className="rounded-full bg-slate-800 object-cover ring-1 ring-white/10"
          style={{ width: s, height: s }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-slate-700 font-bold text-white ring-1 ring-white/10"
          style={{ width: s, height: s, fontSize: s * 0.32 }}
        >
          {symbol.slice(0, 3)}
        </span>
      )}
      {badge && (
        <img
          src={badge}
          alt=""
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-slate-900 ring-2 ring-slate-900 object-cover"
          style={{ width: badgeS, height: badgeS }}
        />
      )}
    </>
  );

  if (glass) {
    return (
      <LiquidGlassTokenOrb variant={glassVariant} size={s} className="shrink-0">
        <div className="relative" style={{ width: s, height: s }}>
          {inner}
        </div>
      </LiquidGlassTokenOrb>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: s, height: s }}>
      {inner}
    </div>
  );
}
