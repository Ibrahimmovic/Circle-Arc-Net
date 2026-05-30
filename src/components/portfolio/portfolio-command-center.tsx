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
import { PortfolioChainMatrix } from "./portfolio-chain-matrix";
import { PortfolioChainDrilldown } from "./portfolio-chain-drilldown";
import { PortfolioOverviewCharts } from "./portfolio-overview-charts";
import { PortfolioAssetsTable } from "./portfolio-assets-table";
import { PortfolioNftCollections } from "./portfolio-nft-collections";
import { PortfolioNftGrid } from "./portfolio-nft-grid";
import { assetMatchesChain } from "@/lib/portfolio-chain-utils";
import { PortfolioActivityList } from "./portfolio-activity-list";
import { PortfolioAdaptivePanel } from "./portfolio-adaptive-panel";
import { PortfolioPositionCards } from "./portfolio-position-cards";
import { PortfolioSetupBanner } from "./portfolio-setup-banner";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { CoinStrip } from "@/components/dashboard/coin-strip";
import { cn, formatUsd } from "@/lib/utils";
import type { MarketRegime } from "@/lib/types";
import { DEFAULT_CHART_PERIOD, type ChartPeriod } from "@/lib/chart-period";
import {
  GlassBadge,
  GlassIconOrb,
  GlassPanel,
  LiquidGlassButton,
} from "@/components/ui/glass-ui";

const TABS = [
  { id: "overview", label: "Portfolio", icon: LayoutGrid },
  { id: "assets", label: "Tokens", icon: Coins },
  { id: "nfts", label: "NFTs", icon: Image },
  { id: "activity", label: "Transactions", icon: History },
  { id: "spam", label: "Flagged", icon: ShieldAlert },
  { id: "adaptive", label: "Adaptive", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PortfolioCommandCenter() {
  const { address, isConnected } = useAccount();
  const { network, isTestnet } = useNetwork();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(DEFAULT_CHART_PERIOD);
  const { data, loading, refresh } = usePortfolioWallet(
    isConnected ? address : undefined,
    chartPeriod,
  );
  const [tab, setTab] = useState<TabId>("overview");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [hideSpam, setHideSpam] = useState(true);

  const analysis = data?.analysis;
  const regime = (analysis?.regime ?? "neutral") as MarketRegime;

  const activeChainId = selectedChainId ?? (chainFilter !== "all" ? chainFilter : null);

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    if (!activeChainId || activeChainId === "all") return data.assets;
    return data.assets.filter((a) => assetMatchesChain(a, activeChainId));
  }, [data, activeChainId]);

  const selectedChainMeta = useMemo(() => {
    if (!data || !selectedChainId) return null;
    return data.allChainBalances.find((c) => c.chainId === selectedChainId) ?? null;
  }, [data, selectedChainId]);

  const chainDrillAssets = useMemo(() => {
    if (!data || !selectedChainId) return [];
    return data.assets
      .filter((a) => assetMatchesChain(a, selectedChainId))
      .sort((a, b) => b.valueUsd - a.valueUsd);
  }, [data, selectedChainId]);

  const nftUsd = useMemo(
    () => (data?.nfts ?? []).reduce((s, n) => s + (n.floorUsd ?? 0), 0),
    [data?.nfts],
  );

  const activityItems = useMemo(() => {
    if (!data) return [];
    const list = hideSpam ? data.activities : [...data.activities, ...data.spamActivities];
    if (chainFilter === "all") return list;
    return list.filter(
      (t) => (t.chainId ?? t.chain) === chainFilter || t.chain === chainFilter,
    );
  }, [data, chainFilter, hideSpam]);

  const counts = useMemo(
    () => ({
      assets: data?.aggregatedAssets.length ?? data?.assets.length ?? 0,
      nfts: data?.nfts.length ?? 0,
      activity: data?.activities.length ?? 0,
      spam:
        (data?.spamAssets.length ?? 0) + (data?.spamActivities.length ?? 0),
      chains: data?.allChainBalances.length ?? 0,
    }),
    [data],
  );

  const chainOptions = useMemo(
    () => [
      { id: "all", label: "All chains" },
      ...(data?.allChainBalances ?? []).map((c) => ({
        id: c.chainId,
        label: c.chain,
      })),
    ],
    [data?.allChainBalances],
  );

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <GlassPanel strong className="overflow-hidden">
          <MarketTicker variant="glass" />
          <CoinStrip variant="glass" />
        </GlassPanel>
        <GlassPanel strong className="p-8 text-center sm:p-10">
          <GlassIconOrb icon={Wallet} variant="cyan" size="lg" className="mx-auto" />
          <p className="relative mt-6 font-display text-2xl font-bold text-white">
            Connect wallet for DeBank-style portfolio
          </p>
          <p className="relative mx-auto mt-2 max-w-lg text-sm text-white/60">
            Multichain net worth, per-chain breakdown, aggregated tokens across
            networks, NFT collections, and labeled transaction history — Zerion
            + GoldRush, like DeBank and Zerion.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <GlassPanel strong className="overflow-hidden">
        <MarketTicker variant="glass" />
        <CoinStrip variant="glass" />
      </GlassPanel>

      <div className="flex flex-wrap items-center gap-2">
        <GlassBadge>
          Viewing: {data?.networkMode ?? network}
          {isTestnet ? " (Arc testnet)" : " (live mainnet)"}
        </GlassBadge>
        <span className="text-[10px] text-white/45">
          Switch Testnet ↔ Mainnet in the header — both stay available
        </span>
        <LiquidGlassButton
          variant="ghost"
          onClick={() => refresh()}
          className="!min-h-[40px] !px-3 !py-2 !text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync portfolio
        </LiquidGlassButton>
        {data?.dataFreshness && (
          <span className="text-[10px] text-white/45">
            Updated {new Date(data.dataFreshness).toLocaleTimeString()}
          </span>
        )}
        {data?.sources && (
          <span className="hidden text-[10px] text-white/45 sm:inline">
            {data.sources.join(" · ")}
          </span>
        )}
      </div>

      {loading && !data?.totalUsd && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <p className="text-white/60">Scanning {counts.chains || "all"} chains…</p>
        </div>
      )}

      {data && (
        <>
          <PortfolioSetupBanner
            zerionAvailable={data.zerionAvailable}
            dataSourceLabel={data.dataSourceLabel}
            apis={data.apisConfigured}
            zerionStatus={data.zerionStatus}
            zerionMessage={data.zerionMessage}
          />

          <PortfolioHero
            totalUsd={data.totalUsd}
            change24hPct={data.change24hPct}
            regime={regime}
            chainCount={data.allChainBalances.length}
            sparkline={data.sparkline ?? data.portfolioChart?.values ?? []}
            portfolioChartSource={data.portfolioChart?.source}
            sources={data.sources}
            dataSourceLabel={data.dataSourceLabel}
            loading={loading}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="portfolio-glass-tab-bar flex gap-1 overflow-x-auto scrollbar-thin">
              {TABS.map(({ id, label, icon: Icon }) => {
                const orbVariant =
                  id === "adaptive"
                    ? "emerald"
                    : id === "spam"
                      ? "coral"
                      : id === "nfts"
                        ? "violet"
                        : "cyan";
                return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "portfolio-glass-tab min-w-0 shrink-0 touch-manipulation sm:px-4",
                    tab === id && "portfolio-glass-tab--active",
                    id === "spam" && tab === id && "portfolio-glass-tab--amber",
                  )}
                >
                  <GlassIconOrb icon={Icon} variant={orbVariant} size="sm" />
                  <span className="truncate">{label}</span>
                  {id === "assets" && counts.assets > 0 && (
                    <span className="text-[10px] text-white/50">{counts.assets}</span>
                  )}
                  {id === "nfts" && counts.nfts > 0 && (
                    <span className="text-[10px] text-white/50">{counts.nfts}</span>
                  )}
                  {id === "activity" && counts.activity > 0 && (
                    <span className="text-[10px] text-white/50">{counts.activity}</span>
                  )}
                  {id === "spam" && counts.spam > 0 && (
                    <span className="rounded-full bg-amber-500/25 px-1.5 text-[10px] text-amber-100">
                      {counts.spam}
                    </span>
                  )}
                </button>
                );
              })}
            </div>

            {tab !== "adaptive" && tab !== "spam" && (
              <select
                value={chainFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setChainFilter(v);
                  setSelectedChainId(v === "all" ? null : v);
                }}
                className="portfolio-glass-select min-h-[40px] rounded-xl px-3 text-xs text-white"
              >
                {chainOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <PortfolioPositionCards
                walletUsd={data.walletUsd}
                defiUsd={data.defiUsd}
                totalUsd={data.totalUsd}
              />

              <PortfolioOverviewCharts
                chains={data.allChainBalances}
                portfolioChart={data.portfolioChart}
                change24hPct={data.change24hPct}
                change24hUsd={data.change24hUsd}
                chartPeriod={chartPeriod}
                onChartPeriodChange={setChartPeriod}
              />

              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    By chain
                  </h3>
                  <span className="text-xs text-slate-500">
                    Tap a chain to see every token on that network
                  </span>
                </div>
                <PortfolioChainMatrix
                  chains={data.allChainBalances}
                  totalUsd={data.totalUsd}
                  selectedChainId={selectedChainId}
                  onSelectChain={(id) => {
                    setSelectedChainId(id);
                    setChainFilter(id);
                  }}
                />
              </div>

              {selectedChainMeta && selectedChainId && (
                <PortfolioChainDrilldown
                  chainId={selectedChainId}
                  chainLabel={selectedChainMeta.chain}
                  valueUsd={selectedChainMeta.valueUsd}
                  percent={selectedChainMeta.percent}
                  assets={chainDrillAssets}
                  onClear={() => {
                    setSelectedChainId(null);
                    setChainFilter("all");
                  }}
                />
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-panel rounded-2xl p-5 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Top assets
                  </h3>
                  <PortfolioAssetsTable assets={filteredAssets.slice(0, 8)} />
                </div>
                <div className="glass-panel rounded-2xl p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Recent transactions
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTab("activity")}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      See all
                    </button>
                  </div>
                  <PortfolioActivityList
                    items={data.activities.slice(0, 6)}
                    emptyLabel="No transactions — connect Zerion API key on server."
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "assets" && (
            <div className="space-y-4">
              {selectedChainMeta && selectedChainId && (
                <PortfolioChainDrilldown
                  chainId={selectedChainId}
                  chainLabel={selectedChainMeta.chain}
                  valueUsd={selectedChainMeta.valueUsd}
                  percent={selectedChainMeta.percent}
                  assets={chainDrillAssets}
                  onClear={() => {
                    setSelectedChainId(null);
                    setChainFilter("all");
                  }}
                />
              )}
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">All tokens</h3>
                  <p className="text-xs text-slate-500">
                    {formatUsd(data.totalUsd)} net worth · live prices & icons ·{" "}
                    {filteredAssets.length} on{" "}
                    {activeChainId ? selectedChainMeta?.chain ?? "chain" : "all chains"}
                  </p>
                </div>
                <PortfolioAssetsTable assets={filteredAssets} />
              </div>
            </div>
          )}

          {tab === "nfts" && (
            <div className="space-y-6">
              {!data.zerionAvailable && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  NFT indexing works best with ZERION_API_KEY on Vercel (mainnet). GoldRush
                  also scans Base, Ethereum, and major L2s.
                </p>
              )}
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Your NFTs ({counts.nfts})
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  Grid view · Zerion + GoldRush
                </p>
                <PortfolioNftGrid nfts={data.nfts} />
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Collections
                </h3>
                <PortfolioNftCollections
                  collections={data.nftCollections}
                  totalNftUsd={nftUsd}
                />
              </div>
            </div>
          )}

          {tab === "activity" && (
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Transaction history
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send, receive, trade, contract calls — like DeBank
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={hideSpam}
                    onChange={(e) => setHideSpam(e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  Hide spam
                </label>
              </div>
              {!data.zerionAvailable && (
                <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Set ZERION_API_KEY on Vercel for full labeled history.
                </p>
              )}
              <PortfolioActivityList
                items={activityItems}
                emptyLabel="No transactions on this filter."
              />
            </div>
          )}

          {tab === "spam" && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl border-amber-500/20 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-100">
                  <ShieldAlert className="h-5 w-5" />
                  Flagged tokens
                </h3>
                <p className="mt-1 mb-4 text-xs text-slate-500">
                  GoldRush is_spam + Zerion trash + meme patterns — verified tokens stay in Assets
                </p>
                <PortfolioAssetsTable
                  assets={data.spamAssets}
                  emptyLabel="No flagged tokens."
                />
              </div>
              <div className="glass-panel rounded-2xl border-amber-500/20 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-amber-100">
                  Flagged transactions
                </h3>
                <PortfolioActivityList
                  items={data.spamActivities}
                  emptyLabel="No flagged transactions."
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
