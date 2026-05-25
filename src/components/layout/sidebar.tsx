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

const nav = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/portfolio", label: "Adaptive Portfolio", icon: PieChart },
  { href: "/execute", label: "Cross-Chain Execute", icon: Zap },
  { href: "/agent", label: "Agent Console", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel flex w-64 shrink-0 flex-col border-r border-slate-800/80 rounded-none lg:min-h-screen">
      <div className="border-b border-slate-800/60 p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30">
            <span className="text-lg font-bold text-cyan-300">Λ</span>
            <span className="absolute inset-0 rounded-xl ring-1 ring-cyan-400/40 animate-pulse-glow" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Agora Forge</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Agent Markets
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
                  ? "bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
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
