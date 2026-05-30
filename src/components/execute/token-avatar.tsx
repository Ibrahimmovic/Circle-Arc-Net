"use client";

import { useState } from "react";
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
  const [imgFailed, setImgFailed] = useState(false);
  const [badgeFailed, setBadgeFailed] = useState(false);
  const src = imgFailed ? undefined : tokenIcon(symbol);
  const badge = chainKey && !badgeFailed ? chainIcon(chainKey) : undefined;
  const s = size;
  const badgeS = Math.round(size * 0.38);

  const inner = (
    <>
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="rounded-full bg-slate-900 object-cover ring-1 ring-white/10"
          style={{ width: s, height: s }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 font-bold text-white ring-1 ring-white/10"
          style={{ width: s, height: s, fontSize: s * 0.28 }}
        >
          {symbol.slice(0, 3)}
        </span>
      )}
      {badge && (
        <img
          src={badge}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBadgeFailed(true)}
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-slate-900 ring-2 ring-slate-900 object-cover"
          style={{ width: badgeS, height: badgeS }}
        />
      )}
    </>
  );

  if (glass) {
    return (
      <LiquidGlassTokenOrb variant={glassVariant} size={s} className="shrink-0">
        <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
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
