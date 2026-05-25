"use client";

import { useEffect, useState } from "react";
import { getTxLog, type TxRecord } from "@/lib/tx-store";
import { explorerLabel, shortHash, txExplorerLink } from "@/lib/explorers";
import { Activity, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

export function ActivityFeed({ expanded = false }: { expanded?: boolean }) {
  const [log, setLog] = useState<TxRecord[]>([]);

  useEffect(() => {
    const load = () => setLog(getTxLog());
    load();
    window.addEventListener("agora-tx-update", load);
    return () => window.removeEventListener("agora-tx-update", load);
  }, []);

  const items = expanded ? log : log.slice(0, 5);

  return (
    <div
      className={`glass-panel rounded-2xl p-5 ${expanded ? "min-h-[320px]" : ""}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Agent activity
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Bridge, swap, or faucet actions appear here with Circle fee notes.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((tx) => (
            <li
              key={tx.id}
              className="flex gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3"
            >
              {tx.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : tx.status === "error" ? (
                <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
              ) : (
                <Clock className="h-5 w-5 shrink-0 text-amber-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{tx.summary}</p>
                <p className="text-xs text-slate-500">
                  {tx.type.toUpperCase()}
                  {tx.chain ? ` · ${tx.chain}` : ""}
                  {tx.feeUsd ? ` · fee ${tx.feeUsd}` : ""}
                  {" · "}
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </p>
                {tx.steps && tx.steps.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {tx.steps.map((s) => {
                      const href = s.hash
                        ? txExplorerLink(s.chainId, s.hash)
                        : undefined;
                      return (
                        <li key={`${s.chainId}-${s.hash ?? "skip"}-${s.label}`}>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-cyan-300"
                            >
                              {s.label} · {explorerLabel(s.chainId)}
                              {s.hash ? ` · ${shortHash(s.hash)}` : ""}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              {s.label}
                              {s.note ? ` · ${s.note}` : ""}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {tx.hash && !tx.steps?.length && (
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    {shortHash(tx.hash)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
