import type {
  ChainAllocation,
  MarketRegime,
  PortfolioAnalysis,
  RebalanceAction,
  TargetAllocation,
} from "./types";

const CHAIN_LABELS: Record<string, string> = {
  ethereum: "Ethereum",
  eth: "Ethereum",
  "eth-mainnet": "Ethereum",
  base: "Base",
  "base-mainnet": "Base",
  "base sepolia": "Base Sepolia",
  arbitrum: "Arbitrum",
  "arbitrum-mainnet": "Arbitrum",
  polygon: "Polygon",
  "polygon-mainnet": "Polygon",
  optimism: "Optimism",
  "optimism-mainnet": "Optimism",
  solana: "Solana",
  avalanche: "Avalanche",
  arc: "Arc",
  "arc-testnet": "Arc Testnet",
};

function normalizeChain(key: string): string {
  const lower = key.toLowerCase();
  return CHAIN_LABELS[lower] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

const REGIME_TARGETS: Record<
  MarketRegime,
  Record<string, number>
> = {
  "risk-on": {
    Ethereum: 25,
    Base: 30,
    Arbitrum: 20,
    Polygon: 10,
    Arc: 15,
  },
  neutral: {
    Ethereum: 30,
    Base: 25,
    Arbitrum: 20,
    Polygon: 15,
    Arc: 10,
  },
  "risk-off": {
    Ethereum: 35,
    Base: 15,
    Arbitrum: 15,
    Polygon: 10,
    Arc: 25,
  },
};

export function detectRegime(change24hPct: number): {
  regime: MarketRegime;
  score: number;
} {
  if (change24hPct >= 2) return { regime: "risk-on", score: Math.min(change24hPct / 5, 1) };
  if (change24hPct <= -2) return { regime: "risk-off", score: Math.min(Math.abs(change24hPct) / 5, 1) };
  return { regime: "neutral", score: 0.5 };
}

function buildTargetAllocations(regime: MarketRegime): TargetAllocation[] {
  const targets = REGIME_TARGETS[regime];
  const rationales: Record<MarketRegime, string> = {
    "risk-on": "Favor L2 + Arc for lower USDC tx costs and faster agent rebalancing.",
    neutral: "Balanced multichain USDC with Arc as execution hub.",
    "risk-off": "Increase Arc + Ethereum weight for stable settlement and liquidity depth.",
  };

  return Object.entries(targets).map(([chain, targetPercent]) => ({
    chain,
    targetPercent,
    rationale: rationales[regime],
  }));
}

function concentrationLevel(maxPct: number): "low" | "medium" | "high" {
  if (maxPct >= 70) return "high";
  if (maxPct >= 45) return "medium";
  return "low";
}

export function analyzePortfolio(params: {
  address: string;
  totalUsd: number;
  change24hPct: number;
  chainDistribution: Record<string, number>;
}): PortfolioAnalysis {
  const { address, totalUsd, change24hPct, chainDistribution } = params;
  const { regime, score } = detectRegime(change24hPct);

  const chainAllocations: ChainAllocation[] = Object.entries(chainDistribution)
    .map(([chain, valueUsd]) => ({
      chain: normalizeChain(chain),
      valueUsd,
      percent: totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const targetAllocations = buildTargetAllocations(regime);
  const rebalanceActions: RebalanceAction[] = [];
  let actionIdx = 0;

  for (const target of targetAllocations) {
    const current = chainAllocations.find(
      (c) => c.chain.toLowerCase() === target.chain.toLowerCase(),
    );
    const currentPct = current?.percent ?? 0;
    const drift = currentPct - target.targetPercent;

    if (Math.abs(drift) < 5) continue;

    const amountUsd = Math.abs((drift / 100) * totalUsd);
    const overweight = drift > 0;

    if (overweight) {
      const sink =
        targetAllocations.find((t) => {
          const c = chainAllocations.find(
            (a) => a.chain.toLowerCase() === t.chain.toLowerCase(),
          );
          return (c?.percent ?? 0) < t.targetPercent;
        })?.chain ?? "Arc";

      rebalanceActions.push({
        id: `rb-${actionIdx++}`,
        type: "bridge",
        fromChain: target.chain,
        toChain: sink,
        amountUsd,
        token: "USDC",
        priority: Math.abs(drift) > 15 ? "high" : "medium",
        reason: `Overweight ${target.chain} by ${drift.toFixed(1)}% vs ${regime} regime target.`,
      });
    }
  }

  const maxPct = Math.max(...chainAllocations.map((c) => c.percent), 0);

  return {
    address,
    totalUsd,
    change24hPct,
    regime,
    regimeScore: score,
    chainAllocations,
    targetAllocations,
    rebalanceActions,
    concentrationRisk: concentrationLevel(maxPct),
    arcAdvantage:
      "Arc settles in sub-second finality with ~$0.01 USDC fees — ideal for agent-driven CCTP rebalancing via Circle App Kit.",
    updatedAt: new Date().toISOString(),
  };
}

/** Canonical chain key for merging Zerion + GoldRush (avoids duplicate "Base"). */
export function canonicalChainKey(chainId: string): string {
  const c = chainId.toLowerCase().replace(/_/g, "-");
  if (c.includes("base")) return "base";
  if (c.includes("ethereum") || c === "eth" || c.startsWith("eth-")) return "ethereum";
  if (c.includes("arbitrum") || c === "arb") return "arbitrum";
  if (c.includes("optimism") || c === "op") return "optimism";
  if (c.includes("polygon") || c === "matic") return "polygon";
  if (c.includes("avalanche") || c === "avax") return "avalanche";
  if (c.includes("arc")) return "arc";
  return c.replace(/-mainnet$/, "").replace(/-sepolia$/, "");
}

export function mergeChainData(
  zerionChains: Record<string, number>,
  goldrushChains: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = {};

  const add = (rawKey: string, quote: number) => {
    if (quote <= 0) return;
    const key = canonicalChainKey(rawKey);
    merged[key] = (merged[key] ?? 0) + quote;
  };

  for (const [name, quote] of Object.entries(zerionChains)) {
    add(name, quote);
  }
  for (const [name, quote] of Object.entries(goldrushChains)) {
    add(name, quote);
  }

  return merged;
}
