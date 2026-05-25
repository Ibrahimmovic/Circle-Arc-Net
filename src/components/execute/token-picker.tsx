"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import type { ChainOption } from "@/lib/network";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { getTokensForChain } from "@/lib/execute-tokens";
import { TokenAvatar } from "./token-avatar";

export function TokenPicker({
  title,
  chains,
  chainKey,
  tokenSymbol,
  onSelect,
  onClose,
}: {
  title: string;
  chains: ChainOption[];
  chainKey: string;
  tokenSymbol: string;
  onSelect: (chain: string, token: string) => void;
  onClose: () => void;
}) {
  const [netFilter, setNetFilter] = useState<string | "all">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list: Array<{ chain: ChainOption; token: ExecuteToken }> = [];
    for (const c of chains) {
      if (netFilter !== "all" && c.appKitChain !== netFilter) continue;
      for (const t of getTokensForChain(c.appKitChain)) {
        if (
          q &&
          !t.symbol.toLowerCase().includes(q.toLowerCase()) &&
          !t.name.toLowerCase().includes(q.toLowerCase())
        ) {
          continue;
        }
        list.push({ chain: c, token: t });
      }
    }
    return list;
  }, [chains, netFilter, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl sm:max-w-3xl sm:flex-row"
        role="dialog"
      >
        <div className="flex min-w-0 flex-1 flex-col border-slate-800 sm:border-r">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search token"
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto px-2 pb-4">
            {rows.map(({ chain, token }) => {
              const active =
                chain.appKitChain === chainKey && token.symbol === tokenSymbol;
              return (
                <li key={`${chain.id}-${token.symbol}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(chain.appKitChain, token.symbol);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-violet-500/20 ring-1 ring-violet-500/40" : "hover:bg-slate-800/80"
                    }`}
                  >
                    <TokenAvatar symbol={token.symbol} chainKey={chain.appKitChain} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{token.symbol}</p>
                      <p className="truncate text-xs text-slate-400">
                        {token.name} · {chain.label}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex max-h-32 shrink-0 flex-col overflow-y-auto border-t border-slate-800 bg-slate-900/50 sm:max-h-none sm:w-44 sm:border-t-0 sm:border-l">
          <p className="px-3 py-3 text-[10px] font-semibold uppercase text-slate-500">Network</p>
          <button
            type="button"
            onClick={() => setNetFilter("all")}
            className={`mx-2 rounded-lg px-3 py-2 text-left text-sm ${
              netFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400"
            }`}
          >
            All
          </button>
          {chains.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setNetFilter(c.appKitChain)}
              className={`mx-2 mb-1 rounded-lg px-3 py-2 text-left text-sm ${
                netFilter === c.appKitChain ? "bg-slate-800 text-white" : "text-slate-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
