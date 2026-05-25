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
  positionType?: "wallet" | "deposited" | "staked" | "locked" | "reward";
};

export type PortfolioNft = {
  id: string;
  name: string;
  collection?: string;
  chain: string;
  imageUrl?: string;
  floorUsd?: number;
  amount: number;
  isSpam: boolean;
};

export type PortfolioActivity = {
  id: string;
  hash: string;
  chain: string;
  chainId?: string;
  type: string;
  label: string;
  timestamp: string;
  valueUsd?: number;
  isSpam: boolean;
  appName?: string;
  direction?: "in" | "out";
  assetSymbol?: string;
};

export type PortfolioWalletFeed = {
  address: string;
  networkMode: "testnet" | "mainnet";
  totalUsd: number;
  change24hPct: number;
  assets: PortfolioAsset[];
  spamAssets: PortfolioAsset[];
  nfts: PortfolioNft[];
  activities: PortfolioActivity[];
  spamActivities: PortfolioActivity[];
  chainBalances: Array<{
    chain: string;
    chainId: string;
    valueUsd: number;
    percent: number;
  }>;
  distributionByType?: Record<string, number>;
  sources: string[];
  dataFreshness: string;
  zerionAvailable: boolean;
};
