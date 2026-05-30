"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetwork } from "@/providers/network-context";
import { APP_NAV } from "@/lib/nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { network } = useNetwork();

  return (
    <aside className="glass-panel z-10 hidden w-64 shrink-0 flex-col rounded-none border-r border-cyan-500/10 lg:flex lg:min-h-screen">
      <div className="border-b border-slate-800/60 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="premium-logo relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/30">
            <span className="font-display relative z-10 text-lg font-extrabold text-white">A</span>
          </div>
          <div>
            <p className="font-display text-base font-bold text-white transition-colors group-hover:text-cyan-200">
              Agora Forge
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">
              Circle × Arc
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {APP_NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.2)] ring-1 ring-cyan-500/25"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-800/60 p-4">
        <p className="px-2 text-[10px] uppercase tracking-wider text-slate-500">
          Built for Agora Hackathon
        </p>
        <span className="mx-2 mt-1 inline-block rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-300">
          {network}
        </span>
        <a
          href="https://docs.arc.network/app-kit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-cyan-300"
        >
          Circle App Kit <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://discord.gg/TGnyfKh23V"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-violet-300"
        >
          Canteen Discord <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}
