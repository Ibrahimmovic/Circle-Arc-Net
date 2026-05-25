"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioAnalysis } from "@/lib/types";

interface DashboardData {
  analysis: PortfolioAnalysis | null;
  topPositions: Array<{
    id: string;
    name?: string;
    value: number;
    change24h: number;
    chain?: string;
  }>;
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
    sources: string[];
    apisConfigured: Record<string, boolean>;
  };
  hint?: string;
  error?: string;
}

export function useDashboard(address: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?address=${address}`);
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
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
