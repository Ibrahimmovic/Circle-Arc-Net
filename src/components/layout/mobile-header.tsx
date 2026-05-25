"use client";

import Link from "next/link";

export function MobileHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/95 px-4 py-3 lg:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600">
          <span className="font-display text-sm font-extrabold text-white">A</span>
        </div>
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-bold text-white">
            Agora Forge
          </p>
          <p className="text-[9px] uppercase tracking-wider text-cyan-400/70">
            Circle × Arc
          </p>
        </div>
      </Link>
    </div>
  );
}
