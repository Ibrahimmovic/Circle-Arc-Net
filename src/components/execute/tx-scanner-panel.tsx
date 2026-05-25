"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Wallet } from "lucide-react";
import {
  addressExplorerLink,
  explorerLabel,
  shortAddress,
  shortHash,
  txExplorerLink,
} from "@/lib/explorers";
import { fetchTxGas, type TxScanStep } from "@/lib/tx-scanner";

interface TxScannerPanelProps {
  walletAddress?: string;
  /** Chains to show wallet address links (e.g. Arc + Base for bridge) */
  walletChainIds: number[];
  steps: TxScanStep[];
  title?: string;
}

export function TxScannerPanel({
  walletAddress,
  walletChainIds,
  steps,
  title = "Transaction scanner",
}: TxScannerPanelProps) {
  const [gasByKey, setGasByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!steps.length) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        steps.map(async (s) => {
          const key = `${s.chainId}:${s.hash}`;
          const gas = await fetchTxGas(s.chainId, s.hash);
          if (gas) next[key] = gas;
        }),
      );
      if (!cancelled) setGasByKey(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [steps]);

  if (!walletAddress && steps.length === 0) return null;

  const uniqueChains = [...new Set(walletChainIds)].filter(
    (id) => addressExplorerLink(id, walletAddress ?? "0x0"),
  );

  return (
    <div className="mt-3 rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90">
        {title}
      </p>

      {walletAddress && uniqueChains.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] text-slate-500">
            <Wallet className="h-3 w-3" />
            Your wallet on each chain
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueChains.map((chainId) => {
              const href = addressExplorerLink(chainId, walletAddress);
              if (!href) return null;
              return (
                <a
                  key={chainId}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 font-mono text-[11px] text-cyan-200 hover:border-cyan-500/50 hover:bg-slate-800"
                >
                  {explorerLabel(chainId)} · {shortAddress(walletAddress)}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <ul className="space-y-2">
          {steps.map((s) => {
            const href = txExplorerLink(s.chainId, s.hash);
            const gas = gasByKey[`${s.chainId}:${s.hash}`];
            const statusColor =
              s.status === "error"
                ? "text-rose-300"
                : s.status === "pending"
                  ? "text-amber-300"
                  : "text-emerald-300";
            return (
              <li
                key={`${s.chainId}:${s.hash}:${s.label}`}
                className="rounded-lg border border-slate-800/80 bg-slate-900/50 px-2.5 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-medium ${statusColor}`}>
                    {s.label}
                    <span className="ml-1 font-normal text-slate-500">
                      · {explorerLabel(s.chainId)}
                    </span>
                  </span>
                  {gas && (
                    <span className="text-[10px] text-slate-400">
                      Gas ~{gas}
                    </span>
                  )}
                </div>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-violet-300 hover:text-cyan-300"
                  >
                    {shortHash(s.hash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    {shortHash(s.hash)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {steps.some((s) => s.label.includes("Bridge burn")) && (
        <p className="mt-2 text-[10px] text-slate-500">
          CCTP mint on the destination chain may appear in ~15 min (SLOW). Track your wallet on
          both explorers above.
        </p>
      )}
    </div>
  );
}
