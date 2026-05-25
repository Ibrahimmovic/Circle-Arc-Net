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
  walletChainIds: number[];
  steps: TxScanStep[];
  title?: string;
  variant?: "result" | "compact";
}

export function TxScannerPanel({
  walletAddress,
  walletChainIds,
  steps,
  title = "On-chain receipts",
  variant = "result",
}: TxScannerPanelProps) {
  const [gasByKey, setGasByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!steps.length) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        steps.map(async (s) => {
          if (!s.hash || s.hash.length < 10) return;
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
    <div
      className={
        variant === "compact"
          ? "mt-2 rounded-xl border border-white/10 bg-black/20 p-2 backdrop-blur-md"
          : "mt-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-3 backdrop-blur-xl"
      }
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      {walletAddress && uniqueChains.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uniqueChains.map((chainId) => {
            const href = addressExplorerLink(chainId, walletAddress);
            if (!href) return null;
            return (
              <a
                key={chainId}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10"
              >
                <Wallet className="h-3 w-3 text-cyan-400/80" />
                {explorerLabel(chainId)} · {shortAddress(walletAddress)}
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            );
          })}
        </div>
      )}

      {steps.length > 0 && (
        <ul className="space-y-2">
          {steps.map((s) => {
            const href = s.hash ? txExplorerLink(s.chainId, s.hash) : undefined;
            const gas = s.hash ? gasByKey[`${s.chainId}:${s.hash}`] : undefined;
            const isSkipped = s.status === "skipped" || !s.hash;
            return (
              <li
                key={`${s.chainId}:${s.label}:${s.hash ?? "x"}`}
                className="rounded-xl border border-white/8 bg-black/25 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-xs font-medium ${
                        isSkipped
                          ? "text-slate-500"
                          : s.status === "error"
                            ? "text-rose-300"
                            : "text-emerald-200"
                      }`}
                    >
                      {s.label}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {explorerLabel(s.chainId)}
                      {s.note ? ` · ${s.note}` : ""}
                    </p>
                  </div>
                  {gas && (
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                      Gas {gas}
                    </span>
                  )}
                </div>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-cyan-300/90 hover:text-cyan-200"
                  >
                    {shortHash(s.hash!)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : isSkipped ? (
                  <p className="mt-1 text-[10px] text-slate-600">
                    Bundled with bridge or already approved
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {steps.some((s) => s.label.includes("burn") || s.label.includes("Bridge")) && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Destination mint (~15 min SLOW CCTP) — track both explorers above.
        </p>
      )}
    </div>
  );
}
