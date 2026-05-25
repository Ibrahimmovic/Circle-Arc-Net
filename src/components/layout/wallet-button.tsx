"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { useNetwork } from "@/providers/network-context";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { useSwitchChain } from "wagmi";

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { isTestnet } = useNetwork();

  const targetChainId = defaultWalletChainId;
  const onWrongChain = isConnected && chainId !== targetChainId;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {onWrongChain && (
          <button
            type="button"
            onClick={() => switchChain({ chainId: targetChainId })}
            className="rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-200"
          >
            Switch to {isTestnet ? "Arc Testnet" : "Ethereum"}
          </button>
        )}
        <button
          type="button"
          onClick={() => disconnect()}
          className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-cyan-100"
        >
          <Wallet className="h-4 w-4 text-cyan-400" />
          <span className="font-mono">{shortenAddress(address)}</span>
          <LogOut className="h-4 w-4 opacity-60" />
        </button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  return (
    <button
      type="button"
      disabled={isPending || !injected}
      onClick={() => connect({ connector: injected, chainId: targetChainId })}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50"
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
