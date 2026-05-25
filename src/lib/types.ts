export type MarketRegime = "risk-on" | "neutral" | "risk-off";

export interface ChainAllocation {
  chain: string;
  chainId?: number;
  valueUsd: number;
  percent: number;
}

export interface TargetAllocation {
  chain: string;
  targetPercent: number;
  rationale: string;
}

export interface RebalanceAction {
  id: string;
  type: "bridge" | "swap" | "hold";
  fromChain: string;
  toChain?: string;
  amountUsd: number;
  token: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface PortfolioAnalysis {
  address: string;
  totalUsd: number;
  change24hPct: number;
  regime: MarketRegime;
  regimeScore: number;
  chainAllocations: ChainAllocation[];
  targetAllocations: TargetAllocation[];
  rebalanceActions: RebalanceAction[];
  concentrationRisk: "low" | "medium" | "high";
  arcAdvantage: string;
  updatedAt: string;
}

export interface BridgeRouteEstimate {
  fromChain: string;
  toChain: string;
  amount: string;
  estimatedFeeUsd?: number;
  estimatedMinutes?: number;
  supported: boolean;
}

export interface CircleHealth {
  walletsConfigured: boolean;
  walletCount: number;
  kitKeyPresent: boolean;
  products: string[];
}
