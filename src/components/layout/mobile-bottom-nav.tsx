"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAV } from "@/lib/nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {APP_NAV.map(({ href, shortLabel, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[52px] min-w-[72px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition touch-manipulation",
                active
                  ? "text-cyan-200"
                  : "text-slate-500 active:text-slate-300",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-cyan-400" : "text-slate-500",
                )}
              />
              <span>{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
