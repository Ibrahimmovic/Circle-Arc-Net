"use client";

import { useNetwork } from "@/providers/network-context";
import { cn } from "@/lib/utils";
import { ARC_FEE_USDC } from "@/lib/network";

export function NetworkToggle({ variant = "default" }: { variant?: "default" | "home" }) {
  const { network, setNetwork, isTestnet } = useNetwork();
  const isHome = variant === "home";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className={
          isHome
            ? "flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5"
            : "flex rounded-xl border border-slate-700/80 bg-slate-900/90 p-1"
        }
      >
        <button
          type="button"
          onClick={() => setNetwork("testnet")}
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
            isTestnet
              ? isHome
                ? "bg-white text-black"
                : "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md"
              : "text-slate-400 hover:text-white",
          )}
        >
          Testnet
        </button>
        <button
          type="button"
          onClick={() => setNetwork("mainnet")}
          className={cn(
            "rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
            !isTestnet
              ? isHome
                ? "bg-white text-black"
                : "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md"
              : "text-slate-400 hover:text-white",
          )}
        >
          Mainnet
        </button>
      </div>
      {isTestnet && (
        <span
          className={
            isHome
              ? "hidden rounded-md border border-white/10 px-3 py-1 text-[10px] font-medium text-slate-400 sm:inline"
              : "hidden rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium text-cyan-200 sm:inline"
          }
        >
          Arc · {ARC_FEE_USDC}
        </span>
      )}
      <span className="text-[10px] text-slate-500">
        {isTestnet
          ? "Arc demo · testnet execute & bridge"
          : "Live wallet · Zerion + GoldRush portfolio"}
      </span>
    </div>
  );
}
