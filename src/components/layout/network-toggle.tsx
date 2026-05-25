"use client";

import { useNetwork } from "@/providers/network-context";
import { cn } from "@/lib/utils";
import { ARC_FEE_USDC } from "@/lib/network";

export function NetworkToggle() {
  const { network, setNetwork, isTestnet } = useNetwork();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-xl border border-slate-700/80 bg-slate-900/90 p-1">
        <button
          type="button"
          onClick={() => setNetwork("testnet")}
          className={cn(
            "rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
            isTestnet
              ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md"
              : "text-slate-400 hover:text-white",
          )}
        >
          Testnet
        </button>
        <button
          type="button"
          onClick={() => setNetwork("mainnet")}
          className={cn(
            "rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
            !isTestnet
              ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md"
              : "text-slate-400 hover:text-white",
          )}
        >
          Mainnet
        </button>
      </div>
      {isTestnet && (
        <span className="hidden rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium text-cyan-200 sm:inline">
          Arc · {ARC_FEE_USDC}
        </span>
      )}
      <span className="text-[10px] text-slate-500 uppercase">
        {network} · Circle CCTP
      </span>
    </div>
  );
}
