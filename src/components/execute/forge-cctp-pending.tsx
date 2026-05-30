"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { explorerForAppKitChain } from "@/lib/explorers";

export function ForgeCctpPending({
  amount,
  fromChain,
  fromLabel,
  toLabel,
  toChain,
  toToken,
  burnTx,
  address,
  network,
  onDismiss,
}: {
  amount: string;
  fromChain: string;
  fromLabel: string;
  toLabel: string;
  toChain: string;
  toToken: string;
  burnTx?: string;
  address: string;
  network: string;
  onDismiss?: () => void;
}) {
  const [destBal, setDestBal] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkDest = async () => {
    setChecking(true);
    try {
      const res = await fetch(
        `/api/execute/dest-balance?address=${address}&chain=${encodeURIComponent(toChain)}&symbol=${toToken}&network=${network}`,
      );
      const j = await res.json();
      if (res.ok) setDestBal(`${j.balance} ${j.symbol} on ${toLabel}`);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const t = window.setInterval(() => void checkDest(), 45_000);
    void checkDest();
    return () => window.clearInterval(t);
  }, [address, toChain, toToken, network]);

  const burnUrl =
    burnTx && burnTx.startsWith("0x")
      ? explorerForAppKitChain(fromChain)?.txUrl(burnTx)
      : undefined;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4 text-sm">
      <p className="font-semibold text-cyan-100">USDC is in transit (Circle CCTP)</p>
      <p className="mt-2 leading-relaxed text-slate-300">
        <strong className="text-white">{amount} USDC</strong> was burned on{" "}
        <strong className="text-white">{fromLabel}</strong>. Mint on{" "}
        <strong className="text-white">{toLabel}</strong> usually takes{" "}
        <strong className="text-amber-200">about 15 minutes</strong> on testnet (SLOW
        path). Your Arc balance dropped — funds are not lost.
      </p>
      {burnUrl && (
        <a
          href={burnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
        >
          View burn transaction <ExternalLink className="h-3 w-3" />
        </a>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void checkDest()}
          disabled={checking}
          className="forge-chip rounded-lg px-3 py-1.5 text-xs"
        >
          {checking ? "Checking…" : "Check destination balance"}
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="forge-chip rounded-lg px-3 py-1.5 text-xs"
          >
            Dismiss
          </button>
        )}
      </div>
      {destBal && (
        <p className="mt-2 text-xs text-emerald-300">Destination now: {destBal}</p>
      )}
    </div>
  );
}
