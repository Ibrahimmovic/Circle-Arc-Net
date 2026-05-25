"use client";

import { tokenIcon, chainIcon } from "@/lib/token-visuals";

export function TokenAvatar({
  symbol,
  chainKey,
  size = 40,
}: {
  symbol: string;
  chainKey?: string;
  size?: number;
}) {
  const src = tokenIcon(symbol);
  const badge = chainKey ? chainIcon(chainKey) : undefined;
  const s = size;
  const badgeS = Math.round(size * 0.38);

  return (
    <div className="relative shrink-0" style={{ width: s, height: s }}>
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
    </div>
  );
}
