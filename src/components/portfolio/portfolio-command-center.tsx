"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  Wallet,
  RefreshCw,
  Coins,
  Image,
  History,
  ShieldAlert,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { usePortfolioWallet } from "@/hooks/use-portfolio-wallet";
import { useNetwork } from "@/providers/network-context";
import { PortfolioHero } from "./portfolio-hero";
import { ChainBalanceGrid } from "./chain-balance-grid";
import { PortfolioAssetsTable } from "./portfolio-assets-table";
import { PortfolioNftGrid } from "./portfolio-nft-grid";
import { PortfolioActivityList } from "./portfolio-activity-list";
import { PortfolioAdaptivePanel } from "./portfolio-adaptive-panel";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { cn } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "assets", label: "Tokens", icon: Coins },
  { id: "nfts", label: "NFTs", icon: Image },
  { id: "activity", label: "Activity", icon: History },
  { id: "spam", label: "Flagged", icon: ShieldAlert },
  { id: "adaptive", label: "Adaptive", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PortfolioCommandCenter() {
  const { address, isConnected } = useAccount();
  const { network, isTestnet } = useNetwork();
  const { data, loading, refresh } = usePortfolioWallet(
    isConnected ? address : undefined,
  );
  const [tab, setTab] = useState<TabId>("overview");

  const analysis = data?.analysis;
  const regime = (analysis?.regime ?? "neutral") as MarketRegime;

  const counts = useMemo(
    () => ({
      assets: data?.assets.length ?? 0,
      nfts: data?.nfts.length ?? 0,
      activity: data?.activities.length ?? 0,
      spam:
        (data?.spamAssets.length ?? 0) + (data?.spamActivities.length ?? 0),
    }),
    [data],
  );

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <MarketTicker />
        <div className="luxury-hero rounded-2xl p-8 text-center sm:p-10">
          <Wallet className="mx-auto h-12 w-12 text-cyan-400" />
          <p className="mt-4 font-display text-2xl font-bold text-white">
            Connect wallet for full portfolio
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            DeBank-style view: tokens, NFTs, on-chain activity, spam filtering,
            and adaptive USDC rebalancing — powered by Zerion, GoldRush, and Arc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <MarketTicker />
      <CoinStrip />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {data?.networkMode ?? network}
          {isTestnet ? " · Arc RPC" : ""}
        </span>
        <button
          type="button"
          onClick={() => refresh()}
          className="flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white touch-manipulation"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync portfolio
        </button>
        {data?.sources && (
          <span className="text-[10px] text-slate-500">
            {data.sources.join(" · ")}
          </span>
        )}
      </div>

      {loading && !data?.totalUsd && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          <p className="text-slate-400">Scanning chains, NFTs & history…</p>
        </div>
      )}

      {data && (
        <>
          <PortfolioHero
            totalUsd={data.totalUsd}
            change24hPct={data.change24hPct}
            regime={regime}
            chainCount={data.chainBalances.length}
            sparkline={data.sparkline ?? []}
            sources={data.sources}
            loading={loading}
          />

          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 p-1 scrollbar-thin [-webkit-overflow-scrolling:touch]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition touch-manipulation sm:px-4",
                  tab === id
                    ? "bg-gradient-to-r from-cyan-500/25 to-violet-500/20 text-white ring-1 ring-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === "assets" && counts.assets > 0 && (
                  <span className="text-[10px] text-slate-500">{counts.assets}</span>
                )}
                {id === "nfts" && counts.nfts > 0 && (
                  <span className="text-[10px] text-slate-500">{counts.nfts}</span>
                )}
                {id === "spam" && counts.spam > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-200">
                    {counts.spam}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatPill label="Tokens" value={String(counts.assets)} />
                <StatPill label="NFTs" value={String(counts.nfts)} />
                <StatPill
                  label="Transactions"
                  value={String(counts.activity)}
                />
              </div>
              <div className="luxury-card rounded-2xl p-5 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  By chain
                </h3>
                <ChainBalanceGrid chains={data.chainBalances} />
              </div>
              {data.assets.length > 0 && (
                <div className="luxury-card rounded-2xl p-5 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Top tokens
                  </h3>
                  <PortfolioAssetsTable assets={data.assets.slice(0, 8)} />
                </div>
              )}
            </div>
          )}

          {tab === "assets" && (
            <div className="luxury-card rounded-2xl p-5 sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-white">
                All tokens
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Clean holdings — spam hidden (see Flagged tab)
              </p>
              <PortfolioAssetsTable assets={data.assets} />
            </div>
          )}

          {tab === "nfts" && (
            <div className="luxury-card rounded-2xl p-5 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                NFT collections
              </h3>
              <PortfolioNftGrid nfts={data.nfts} />
            </div>
          )}

          {tab === "activity" && (
            <div className="luxury-card rounded-2xl p-5 sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Recent activity
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                Swaps, bridges, approvals — Zerion-labeled history
              </p>
              {!data.zerionAvailable && (
                <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Add ZERION_API_KEY for full transaction history on testnet.
                </p>
              )}
              <PortfolioActivityList
                items={data.activities}
                emptyLabel="No recent transactions on this network."
              />
            </div>
          )}

          {tab === "spam" && (
            <div className="space-y-6">
              <div className="luxury-card rounded-2xl border-amber-500/20 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <ShieldAlert className="h-5 w-5" />
                  Flagged tokens
                </h3>
                <p className="mt-1 mb-4 text-xs text-slate-500">
                  Low-quality or airdrop spam — hidden from net worth (Zerion +
                  GoldRush)
                </p>
                <PortfolioAssetsTable
                  assets={data.spamAssets}
                  emptyLabel="No spam tokens detected — wallet looks clean."
                />
              </div>
              <div className="luxury-card rounded-2xl border-amber-500/20 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-amber-100">
                  Flagged transactions
                </h3>
                <PortfolioActivityList
                  items={data.spamActivities}
                  emptyLabel="No spam transactions flagged."
                />
              </div>
            </div>
          )}

          {tab === "adaptive" && analysis && (
            <PortfolioAdaptivePanel analysis={analysis} />
          )}

          {tab === "adaptive" && !analysis && (
            <p className="text-center text-slate-500">
              {data.hint ?? "Fund wallet to run adaptive analysis."}
            </p>
          )}
        </>
      )}

      {data?.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          {data.error}
        </p>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
    </div>
  );
}
