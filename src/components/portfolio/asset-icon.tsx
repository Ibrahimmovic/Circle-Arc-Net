"use client";

import { useState } from "react";
import { resolveTokenLogo, tokenIcon } from "@/lib/token-visuals";

export function AssetIcon({
  symbol,
  logoUrl,
  isNative,
  size = 36,
  className = "",
}: {
  symbol: string;
  logoUrl?: string | null;
  isNative?: boolean;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? undefined
    : resolveTokenLogo(symbol, logoUrl, isNative) ?? tokenIcon(symbol);

  const dim = `${size}px`;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full bg-slate-800 object-cover ring-1 ring-white/10 ${className}`}
        style={{ width: dim, height: dim }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 font-bold text-white ring-1 ring-white/10 ${className}`}
      style={{ width: dim, height: dim, fontSize: size < 28 ? 9 : 11 }}
    >
      {symbol.slice(0, 3).toUpperCase()}
    </div>
  );
}
