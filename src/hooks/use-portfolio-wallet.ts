"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioAnalysis } from "@/lib/types";
import type { PortfolioWalletFeed } from "@/lib/portfolio-wallet-types";
import { useNetwork } from "@/providers/network-context";
import type { ChartPeriod } from "@/lib/chart-period";
import { DEFAULT_CHART_PERIOD } from "@/lib/chart-period";

export type PortfolioWalletData = PortfolioWalletFeed & {
  analysis: PortfolioAnalysis | null;
  sparkline?: number[];
  hint?: string;
  error?: string;
};

export function usePortfolioWallet(
  address: string | undefined,
  chartPeriod: ChartPeriod = DEFAULT_CHART_PERIOD,
) {
  const { network } = useNetwork();
  const [data, setData] = useState<PortfolioWalletData | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portfolio/wallet?address=${address}&network=${network}&chartPeriod=${chartPeriod}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setData({
          address,
          networkMode: network,
          totalUsd: 0,
          change24hPct: 0,
          assets: [],
          aggregatedAssets: [],
          spamAssets: [],
          nfts: [],
          nftCollections: [],
          activities: [],
          spamActivities: [],
          chainBalances: [],
          allChainBalances: [],
          walletUsd: 0,
          defiUsd: 0,
          sources: [],
          dataFreshness: new Date().toISOString(),
          zerionAvailable: false,
          dataSourceLabel: "Unavailable",
          apisConfigured: { zerion: false, goldrush: false, coingecko: false },
          analysis: null,
          error: json.error ?? "Failed to load",
        });
      } else {
        setData(json as PortfolioWalletData);
      }
    } catch (e) {
      setData({
        address,
        networkMode: network,
        totalUsd: 0,
        change24hPct: 0,
        assets: [],
        aggregatedAssets: [],
        spamAssets: [],
        nfts: [],
        nftCollections: [],
        activities: [],
        spamActivities: [],
        chainBalances: [],
        allChainBalances: [],
        walletUsd: 0,
        defiUsd: 0,
        sources: [],
        dataFreshness: new Date().toISOString(),
        zerionAvailable: false,
        dataSourceLabel: "Unavailable",
        apisConfigured: { zerion: false, goldrush: false, coingecko: false },
        analysis: null,
        error: e instanceof Error ? e.message : "Failed to load",
      });
    } finally {
      setLoading(false);
    }
  }, [address, network, chartPeriod]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
