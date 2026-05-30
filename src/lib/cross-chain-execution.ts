import type { PortfolioAnalysis, RebalanceAction } from "@/lib/types";
import { isCctpRoute, toCctpChain } from "@/lib/execution/chains";

/** How Agora Forge routes onchain actions — Circle-first, extensible. */
export type ExecutionRailId =
  | "cctp_bridge"
  | "circle_swap"
  | "portfolio_rebalance"
  | "arbitrage"
  | "intent_solver"
  | "generic_calldata"
  | "external_bridge";

export type ExecutionRailStatus = "live" | "beta" | "planned";

export interface ExecutionRail {
  id: ExecutionRailId;
  label: string;
  description: string;
  status: ExecutionRailStatus;
  circleProduct?: string;
  rfb?: string;
}

export interface ExecutionOpportunity {
  id: string;
  kind: ExecutionRailId;
  title: string;
  description: string;
  fromChain?: string;
  toChain?: string;
  token: string;
  amountUsd: number;
  estimatedEdgeBps?: number;
  priority: "high" | "medium" | "low";
  /** Can run today via Circle App Kit on Execute */
  executable: boolean;
  executeHint: string;
}

export interface ExecutionPlan {
  rails: ExecutionRail[];
  opportunities: ExecutionOpportunity[];
  summary: string;
  updatedAt: string;
  /** Runnable job count (compiled server-side) */
  jobCount?: number;
}

export const EXECUTION_RAILS: ExecutionRail[] = [
  {
    id: "cctp_bridge",
    label: "CCTP bridge",
    description: "Burn & mint USDC across EVM chains — primary cross-chain rail.",
    status: "live",
    circleProduct: "App Kit · CCTP",
  },
  {
    id: "circle_swap",
    label: "Circle swap",
    description: "Same-chain token exchange via App Kit before/after bridges.",
    status: "live",
    circleProduct: "App Kit · Swap",
  },
  {
    id: "portfolio_rebalance",
    label: "Adaptive rebalance",
    description: "Regime drift → queued bridge actions from portfolio engine.",
    status: "live",
    rfb: "RFB #04",
  },
  {
    id: "arbitrage",
    label: "Cross-venue arbitrage",
    description: "Detect price gaps across chains; auto-queue CCTP + swap legs.",
    status: "live",
    rfb: "RFB #05",
  },
  {
    id: "intent_solver",
    label: "Intent solver",
    description: "One-shot goals (e.g. USDC Base → token elsewhere) via LI.FI route on testnet.",
    status: "beta",
  },
  {
    id: "generic_calldata",
    label: "Generic calldata",
    description: "Arbitrary contract calls on source/dest chain — agent-guarded.",
    status: "planned",
  },
  {
    id: "external_bridge",
    label: "External bridges",
    description: "LiFi quotes when route is outside CCTP mesh.",
    status: "beta",
  },
];

function rebalanceToOpportunity(a: RebalanceAction): ExecutionOpportunity {
  return {
    id: a.id,
    kind: a.type === "swap" ? "circle_swap" : "portfolio_rebalance",
    title: `${a.type === "bridge" ? "Rebalance bridge" : "Rebalance"} · ${a.token}`,
    description: a.reason,
    fromChain: a.fromChain,
    toChain: a.toChain,
    token: a.token,
    amountUsd: a.amountUsd,
    priority: a.priority,
    executable:
      a.type === "bridge" &&
      Boolean(a.toChain) &&
      isCctpRoute(toCctpChain(a.fromChain), toCctpChain(a.toChain!)),
    executeHint: "Auto-run via execution queue (CCTP) or manual bridge below.",
  };
}

/** Simple cross-chain arb signal: same ticker, different chains, 24h momentum gap. */
export function detectArbitrageOpportunities(
  positions: Array<{
    name?: string;
    value: number;
    change24h: number;
    chain?: string;
  }>,
): ExecutionOpportunity[] {
  const bySymbol = new Map<
    string,
    Array<{ chain: string; value: number; change24h: number }>
  >();

  for (const p of positions) {
    const sym = (p.name ?? "").toUpperCase();
    if (!sym || sym.length > 10 || (p.value ?? 0) < 50) continue;
    const chain = (p.chain ?? "unknown").replace(/-mainnet$/i, "");
    const list = bySymbol.get(sym) ?? [];
    list.push({ chain, value: p.value, change24h: p.change24h });
    bySymbol.set(sym, list);
  }

  const out: ExecutionOpportunity[] = [];
  let idx = 0;

  for (const [symbol, rows] of bySymbol) {
    if (rows.length < 2) continue;
    rows.sort((a, b) => b.change24h - a.change24h);
    const high = rows[0];
    const low = rows[rows.length - 1];
    const spread = high.change24h - low.change24h;
    if (spread < 1.5) continue;

    const notional = Math.min(high.value, low.value);
    out.push({
      id: `arb-${idx++}`,
      kind: "arbitrage",
      title: `Arb signal · ${symbol}`,
      description: `24h gap ${spread.toFixed(1)}% between ${high.chain} (+${high.change24h.toFixed(1)}%) and ${low.chain} (${low.change24h.toFixed(1)}%). Route: bridge USDC via CCTP, swap legs on each chain.`,
      fromChain: low.chain,
      toChain: high.chain,
      token: symbol,
      amountUsd: notional,
      estimatedEdgeBps: Math.round(spread * 10),
      priority: spread > 4 ? "high" : "medium",
      executable: isCctpRoute(toCctpChain(low.chain), toCctpChain(high.chain)),
      executeHint: isCctpRoute(toCctpChain(low.chain), toCctpChain(high.chain))
        ? "Queue: CCTP USDC move + planned swap leg on destination chain."
        : "Use external LiFi rail or manual routing.",
    });
  }

  return out.slice(0, 5);
}

export function buildExecutionPlan(
  analysis: PortfolioAnalysis | null,
  positions: Array<{
    name?: string;
    value: number;
    change24h: number;
    chain?: string;
  }> = [],
): ExecutionPlan {
  const opportunities: ExecutionOpportunity[] = [];

  if (analysis?.rebalanceActions?.length) {
    opportunities.push(...analysis.rebalanceActions.map(rebalanceToOpportunity));
  }

  opportunities.push(...detectArbitrageOpportunities(positions));

  opportunities.sort((a, b) => {
    const score = (o: ExecutionOpportunity) =>
      (o.priority === "high" ? 3 : o.priority === "medium" ? 2 : 1) +
      (o.executable ? 1 : 0);
    return score(b) - score(a);
  });

  const live = opportunities.filter((o) => o.executable).length;
  const arb = opportunities.filter((o) => o.kind === "arbitrage").length;

  return {
    rails: EXECUTION_RAILS,
    opportunities,
    summary: analysis
      ? `${opportunities.length} signals · ${live} executable on Circle CCTP now · ${arb} arb (beta) · intents/calldata on roadmap`
      : "Connect wallet and run portfolio analysis to populate execution queue.",
    updatedAt: new Date().toISOString(),
  };
}
