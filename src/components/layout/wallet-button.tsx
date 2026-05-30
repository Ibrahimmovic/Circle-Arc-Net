"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { useNetwork } from "@/providers/network-context";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { useSwitchChain } from "wagmi";

export function WalletButton({ variant = "default" }: { variant?: "default" | "home" }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { isTestnet } = useNetwork();

  const targetChainId = defaultWalletChainId;
  const onWrongChain = isConnected && chainId !== targetChainId;
  const isHome = variant === "home";

  if (isConnected && address) {
    return (
      <div className="flex max-w-full items-center gap-1.5 sm:gap-2">
        {onWrongChain && (
          <button
            type="button"
            onClick={() => switchChain({ chainId: targetChainId })}
            className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-[10px] font-medium text-amber-200 sm:px-3 sm:text-xs touch-manipulation"
          >
            <span className="hidden min-[400px]:inline">Switch to </span>
            {isTestnet ? "Arc" : "ETH"}
          </button>
        )}
        <button
          type="button"
          onClick={() => disconnect()}
          className={
            isHome
              ? "liquid-glass-btn liquid-glass-btn--ghost !min-h-0 !px-3 !py-2 !text-xs max-w-[min(100%,11rem)] sm:max-w-none touch-manipulation"
              : "flex max-w-[min(100%,11rem)] items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/90 px-2.5 py-2 text-xs font-medium text-cyan-100 sm:max-w-none sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm touch-manipulation"
          }
        >
          <Wallet className={`relative z-10 h-4 w-4 shrink-0 ${isHome ? "text-white/80" : "text-cyan-400"}`} />
          <span className="relative z-10 truncate font-mono">{shortenAddress(address)}</span>
          <LogOut className="relative z-10 h-4 w-4 shrink-0 opacity-60" />
        </button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  if (isHome) {
    return (
      <button
        type="button"
        disabled={isPending || !injected}
        onClick={() => connect({ connector: injected, chainId: targetChainId })}
        className="liquid-glass-btn liquid-glass-btn--primary !min-h-[44px] touch-manipulation disabled:opacity-50 sm:px-6 sm:text-sm"
      >
        <span className="liquid-glass-btn__core" aria-hidden />
        {isPending ? (
          <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="relative z-10 h-4 w-4" />
        )}
        <span className="relative z-10 text-xs font-semibold sm:text-sm">Connect Wallet</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending || !injected}
      onClick={() => connect({ connector: injected, chainId: targetChainId })}
      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50 sm:px-6 sm:text-sm touch-manipulation"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      Connect Wallet
    </button>
  );
}
