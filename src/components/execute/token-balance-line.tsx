"use client";

import { balanceKey, type TokenBalanceRow } from "@/lib/wallet-balances";

export function TokenBalanceLine({
  chain,
  symbol,
  balances,
  loading,
}: {
  chain: string;
  symbol: string;
  balances: TokenBalanceRow[];
  loading?: boolean;
}) {
  const row = balances.find(
    (b) => b.chain === chain && b.symbol.toUpperCase() === symbol.toUpperCase(),
  );

  if (loading) {
    return <p className="text-[10px] text-slate-500">Balance…</p>;
  }

  if (!row) {
    return <p className="text-[10px] text-slate-600">Balance —</p>;
  }

  return (
    <p className="text-[10px] text-cyan-200/80">
      Balance: <span className="font-medium text-cyan-100">{row.balance}</span>{" "}
      {symbol}
    </p>
  );
}

export function balanceMap(rows: TokenBalanceRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    m.set(balanceKey(r.chain, r.symbol), r.balance);
  }
  return m;
}
