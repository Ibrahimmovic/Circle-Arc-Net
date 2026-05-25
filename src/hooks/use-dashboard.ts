"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioAnalysis } from "@/lib/types";
import { useNetwork } from "@/providers/network-context";

interface DashboardData {
  analysis: PortfolioAnalysis | null;
  topPositions: Array<{
    id: string;
    name?: string;
    value: number;
    change24h: number;
    chain?: string;
  }>;
  chainBalances?: Array<{
    chain: string;
    chainId: string;
    valueUsd: number;
    percent: number;
  }>;
  sparkline?: number[];
  markets?: {
    ethChange24h: number;
    btcChange24h: number;
    usdcPrice: number;
  };
  macroRegime?: string;
  health?: {
    network: string;
    kitKeyPresent: boolean;
    walletCount: number;
    chainCount?: number;
    sources: string[];
    apisConfigured: Record<string, boolean>;
  };
  hint?: string;
  error?: string;
  dataFreshness?: string;
}

export function useDashboard(address: string | undefined) {
  const { network } = useNetwork();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?address=${address}&network=${network}`,
      );
      const json = await res.json();
      if (!res.ok && json.error) {
        setData({ analysis: null, topPositions: [], error: json.error });
      } else {
        setData(json);
      }
    } catch (e) {
      setData({
        analysis: null,
        topPositions: [],
        error: e instanceof Error ? e.message : "Failed to load",
      });
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onNet = () => refresh();
    window.addEventListener("agora-network-change", onNet);
    return () => window.removeEventListener("agora-network-change", onNet);
  }, [refresh]);

  return { data, loading, refresh };
}
