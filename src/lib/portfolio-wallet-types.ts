import type { PortfolioDuneAnalytics } from "@/lib/dune";
import type { PortfolioProviderStatus } from "@/lib/portfolio-providers";

export type PortfolioAsset = {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  chainId?: string;
  valueUsd: number;
  balance?: string;
  priceUsd?: number;
  change24hPct: number;
  logoUrl?: string;
  isSpam: boolean;
  isNft: false;
  positionType?: "wallet" | "deposited" | "staked" | "locked" | "reward" | string;
  protocol?: string;
  unverified?: boolean;
};

export type AggregatedAsset = {
  symbol: string;
  name: string;
  logoUrl?: string;
  valueUsd: number;
  priceUsd?: number;
  change24hPct: number;
  networkCount: number;
  networks: string[];
  holdings: PortfolioAsset[];
  /** Sum of numeric balances across holdings (same symbol) */
  totalBalance?: number;
};

export type PortfolioNft = {
  id: string;
  name: string;
  collection?: string;
  chain: string;
  chainId?: string;
  imageUrl?: string;
  floorUsd?: number;
  amount: number;
  isSpam: boolean;
};

export type NftCollectionGroup = {
  id: string;
  name: string;
  chain: string;
  imageUrl?: string;
  count: number;
  floorUsd?: number;
  items: PortfolioNft[];
};

export type PortfolioActivity = {
  id: string;
  hash: string;
  chain: string;
  chainId?: string;
  type: string;
  displayType?: string;
  label: string;
  timestamp: string;
  valueUsd?: number;
  amount?: string;
  assetSymbol?: string;
  isSpam: boolean;
  appName?: string;
  direction?: "in" | "out";
};

export type PortfolioChartPoint = { t: number; v: number };

export type PortfolioChart = {
  period: string;
  points: PortfolioChartPoint[];
  values: number[];
  beginAt?: string;
  endAt?: string;
  pnlUsd: number;
  pnlPct: number;
  source: "zerion" | "estimated";
};

export type PortfolioWalletFeed = {
  address: string;
  networkMode: "testnet" | "mainnet";
  totalUsd: number;
  change24hPct: number;
  change24hUsd?: number;
  portfolioChart?: PortfolioChart;
  assets: PortfolioAsset[];
  aggregatedAssets: AggregatedAsset[];
  spamAssets: PortfolioAsset[];
  nfts: PortfolioNft[];
  nftCollections: NftCollectionGroup[];
  activities: PortfolioActivity[];
  spamActivities: PortfolioActivity[];
  chainBalances: Array<{
    chain: string;
    chainId: string;
    valueUsd: number;
    percent: number;
  }>;
  allChainBalances: Array<{
    chain: string;
    chainId: string;
    valueUsd: number;
    percent: number;
  }>;
  walletUsd: number;
  defiUsd: number;
  distributionByType?: Record<string, number>;
  sources: string[];
  dataFreshness: string;
  zerionAvailable: boolean;
  /** Human-readable primary indexer label for UI */
  dataSourceLabel: string;
  apisConfigured?: PortfolioProviderStatus;
  duneAnalytics?: PortfolioDuneAnalytics;
  /** ok | error | off — why Zerion data may be missing */
  zerionStatus?: "ok" | "error" | "off";
  zerionMessage?: string;
};
