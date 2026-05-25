"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { X, Search } from "lucide-react";
import type { ChainOption } from "@/lib/network";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { getTokensForChain } from "@/lib/execute-tokens";
import {
  balanceKey,
  type TokenBalanceRow,
} from "@/lib/wallet-balances";
import { TokenAvatar } from "./token-avatar";

function balanceForRow(
  balances: Map<string, string>,
  chain: string,
  symbol: string,
): string | null {
  return balances.get(balanceKey(chain, symbol)) ?? null;
}

function parseBalanceAmount(balance: string): number {
  if (balance.startsWith("<")) return 0;
  const n = Number.parseFloat(balance);
  return Number.isFinite(n) ? n : 0;
}

function formatUsdValue(symbol: string, balance: string, ethUsd: number): string | null {
  const amount = parseBalanceAmount(balance);
  if (balance === "0" || amount === 0) {
    if (balance !== "0") return null;
  }

  let usd = 0;
  if (symbol === "USDC" || symbol === "USDT" || symbol === "EURC") {
    usd = amount;
  } else if (symbol === "ETH" || symbol === "WETH") {
    if (ethUsd <= 0) return null;
    usd = amount * ethUsd;
  } else {
    return null;
  }

  if (usd < 0.01 && balance !== "0") return "<$0.01";
  if (usd === 0) return "$0.00";
  if (usd >= 1000) {
    return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `$${usd.toFixed(2)}`;
}

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
  const { address } = useAccount();
  const [netFilter, setNetFilter] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [balances, setBalances] = useState<TokenBalanceRow[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [ethUsd, setEthUsd] = useState(0);

  const chainList = useMemo(
    () => chains.map((c) => c.appKitChain).join(","),
    [chains],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/markets/coins");
        const data = await res.json();
        const eth = Array.isArray(data.coins)
          ? data.coins.find((c: { id?: string }) => c.id === "ethereum")
          : null;
        if (!cancelled && eth?.price) setEthUsd(eth.price);
      } catch {
        /* optional USD hints */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!address) {
      setBalances([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setBalancesLoading(true);
      try {
        const res = await fetch(
          `/api/execute/balances?address=${address}&chains=${encodeURIComponent(chainList)}`,
        );
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.balances)) {
          setBalances(data.balances);
        }
      } catch {
        if (!cancelled) setBalances([]);
      } finally {
        if (!cancelled) setBalancesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, chainList]);

  const balanceMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of balances) {
      m.set(balanceKey(b.chain, b.symbol), b.balance);
    }
    return m;
  }, [balances]);

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-md sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-900/45 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:max-w-3xl sm:flex-row"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 flex-col border-white/10 sm:border-r">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-white">{title}</h3>
            {address && (
              <span className="ml-auto text-[10px] text-slate-500">
                {balancesLoading ? "Loading balances…" : "Balances on-chain"}
              </span>
            )}
          </div>
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search token"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto px-2 pb-4">
            {!address && (
              <li className="px-3 py-4 text-center text-xs text-slate-500">
                Connect wallet to see balances
              </li>
            )}
            {rows.map(({ chain, token }) => {
              const active =
                chain.appKitChain === chainKey && token.symbol === tokenSymbol;
              const bal = address
                ? balanceForRow(balanceMap, chain.appKitChain, token.symbol)
                : null;
              const usd =
                bal != null ? formatUsdValue(token.symbol, bal, ethUsd) : null;
              return (
                <li key={`${chain.id}-${token.symbol}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(chain.appKitChain, token.symbol);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                      active
                        ? "bg-violet-500/25 ring-1 ring-violet-400/35 backdrop-blur-sm"
                        : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <TokenAvatar symbol={token.symbol} chainKey={chain.appKitChain} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{token.symbol}</p>
                      <p className="truncate text-xs text-slate-400">
                        {token.name} · {chain.label}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {balancesLoading ? (
                        <span className="text-[11px] text-slate-600">…</span>
                      ) : bal != null ? (
                        <>
                          <p className="text-sm font-medium tabular-nums text-cyan-100">
                            {bal} {token.symbol}
                          </p>
                          {usd && (
                            <p className="text-[10px] tabular-nums text-slate-400">{usd}</p>
                          )}
                        </>
                      ) : address ? (
                        <span className="text-[11px] text-slate-600">0</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                No tokens match your search
              </li>
            )}
          </ul>
        </div>
        <div className="flex max-h-32 shrink-0 flex-col overflow-y-auto border-t border-white/10 bg-black/20 backdrop-blur-xl sm:max-h-none sm:w-44 sm:border-t-0 sm:border-l">
          <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Network
          </p>
          <button
            type="button"
            onClick={() => setNetFilter("all")}
            className={`mx-2 rounded-lg px-3 py-2 text-left text-sm transition ${
              netFilter === "all"
                ? "bg-white/10 text-white ring-1 ring-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            All
          </button>
          {chains.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setNetFilter(c.appKitChain)}
              className={`mx-2 mb-1 rounded-lg px-3 py-2 text-left text-sm transition ${
                netFilter === c.appKitChain
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
