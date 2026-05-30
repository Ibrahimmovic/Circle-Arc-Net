"use client";

import { useEffect, useState } from "react";
import type { TokenBalanceRow } from "@/lib/wallet-balances";
import { balanceKey } from "@/lib/wallet-balances";

export function useExecBalances(
  address: string | undefined,
  chains: string[],
  enabled: boolean,
  network: "testnet" | "mainnet" = "testnet",
  refreshKey = 0,
) {
  const [balances, setBalances] = useState<TokenBalanceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !address || chains.length === 0) {
      setBalances([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/execute/balances?address=${address}&chains=${encodeURIComponent(chains.join(","))}&network=${network}`,
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.balances)) {
          setBalances(data.balances);
        }
      } catch {
        /* keep prior */
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [address, chains.join(","), enabled, network, refreshKey]);

  const getBalance = (chain: string, symbol: string) =>
    balances.find((b) => balanceKey(b.chain, b.symbol) === balanceKey(chain, symbol));

  return { balances, loading, getBalance };
}
