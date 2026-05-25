"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Zap,
  Bot,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNetworkMode } from "@/lib/network";

const nav = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/portfolio", label: "Adaptive Portfolio", icon: PieChart },
  { href: "/execute", label: "Cross-Chain Execute", icon: Zap },
  { href: "/agent", label: "Agent Console", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel flex w-64 shrink-0 flex-col border-r border-cyan-500/10 rounded-none lg:min-h-screen z-10">
      <div className="border-b border-slate-800/60 p-6 bg-gradient-to-br from-cyan-500/5 to-violet-500/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/30">
            <span className="font-display text-lg font-extrabold text-white">A</span>
          </div>
          <div>
            <p className="font-display text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
              Agora Forge
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">
              Circle × Arc
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {nav.map(({ href, label, icon: Icon }) => {
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

      <div className="border-t border-slate-800/60 p-4 space-y-2">
        <p className="px-2 text-[10px] uppercase tracking-wider text-slate-500">
          Built for Agora Hackathon
        </p>
        <span className="mx-2 mt-1 inline-block rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase">
          {getNetworkMode()} mode
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
