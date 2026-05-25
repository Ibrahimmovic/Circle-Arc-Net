"use client";

import type { ExecuteToken } from "@/lib/execute-tokens";
import type { ChainOption } from "@/lib/network";

export function AssetRow({
  label,
  chainValue,
  chains,
  onChainChange,
  tokenValue,
  tokens,
  onTokenChange,
  amount,
  onAmountChange,
  amountLabel = "Amount",
  readOnlyChain,
}: {
  label: string;
  chainValue: string;
  chains: ChainOption[];
  onChainChange?: (v: string) => void;
  tokenValue: string;
  tokens: ExecuteToken[];
  onTokenChange: (v: string) => void;
  amount?: string;
  onAmountChange?: (v: string) => void;
  amountLabel?: string;
  readOnlyChain?: string;
}) {
  const token = tokens.find((t) => t.symbol === tokenValue) ?? tokens[0];

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {readOnlyChain ? (
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-950/30 px-3 py-2.5 text-sm font-medium text-cyan-100">
            {readOnlyChain}
          </div>
        ) : (
          <select
            value={chainValue}
            onChange={(e) => onChainChange?.(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white"
          >
            {chains.map((c) => (
              <option key={c.id} value={c.appKitChain}>
                {c.label}
                {c.isArc ? " ★" : ""}
              </option>
            ))}
          </select>
        )}
        <select
          value={token?.symbol ?? ""}
          onChange={(e) => onTokenChange(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white"
        >
          {tokens.map((t) => (
            <option key={t.symbol} value={t.symbol}>
              {t.symbol} · {t.name}
            </option>
          ))}
        </select>
      </div>
      {onAmountChange != null && amount != null && (
        <label className="mt-3 block">
          <span className="text-[10px] uppercase text-slate-500">{amountLabel}</span>
          <input
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 font-mono text-white"
          />
        </label>
      )}
    </div>
  );
}
