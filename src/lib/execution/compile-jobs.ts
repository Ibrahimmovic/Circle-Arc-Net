import type { ExecutionOpportunity } from "@/lib/cross-chain-execution";
import type { ExecutionJob, ExecutionStep } from "@/lib/execution/types";
import { isCctpRoute, toCctpChain, usdcAmountFromUsd } from "@/lib/execution/chains";

function step(
  partial: Omit<ExecutionStep, "status"> & { status?: ExecutionStep["status"] },
): ExecutionStep {
  return { status: "pending", ...partial };
}

/** Turn a signal into an executable multi-step job. */
export function compileOpportunityToJob(opp: ExecutionOpportunity): ExecutionJob {
  const steps: ExecutionStep[] = [];
  const from = opp.fromChain ? toCctpChain(opp.fromChain) : undefined;
  const to = opp.toChain ? toCctpChain(opp.toChain) : undefined;
  const usdcAmt = usdcAmountFromUsd(opp.amountUsd);

  if (from && to && isCctpRoute(from, to)) {
    steps.push(
      step({
        id: `${opp.id}-cctp`,
        rail: "cctp_bridge",
        label: `CCTP USDC · ${from} → ${to}`,
        fromChain: from,
        toChain: to,
        token: "USDC",
        amount: usdcAmt,
      }),
    );
  }

  if (opp.kind === "arbitrage" && from && to) {
    steps.push(
      step({
        id: `${opp.id}-swap-leg`,
        rail: "circle_swap",
        label: `Swap leg · ${opp.token} on ${to}`,
        fromChain: to,
        toChain: to,
        token: "USDC",
        toToken: opp.token === "USDC" ? "USDC" : "USDC",
        amount: "1",
        status: "planned",
        detail: "Post-bridge swap via App Kit — enable when token pair configured.",
      }),
    );
  }

  if (opp.kind === "arbitrage" && from && to && !isCctpRoute(from, to)) {
    steps.push(
      step({
        id: `${opp.id}-lifi`,
        rail: "external_bridge",
        label: `LiFi route · ${from} → ${to}`,
        fromChain: from,
        toChain: to,
        token: "USDC",
        amount: usdcAmt,
        status: "planned",
        detail: "Non-CCTP mesh — use LiFi quote in runner.",
      }),
    );
  }

  if (steps.length === 0 && from && to && from === to && opp.kind === "circle_swap") {
    steps.push(
      step({
        id: `${opp.id}-swap`,
        rail: "circle_swap",
        label: `Swap on ${from}`,
        fromChain: from,
        toChain: from,
        token: opp.token,
        toToken: "USDC",
        amount: usdcAmt,
      }),
    );
  }

  if (steps.length === 0) {
    steps.push(
      step({
        id: `${opp.id}-intent`,
        rail: "intent_solver",
        label: "Signed intent (queued)",
        token: opp.token,
        amount: usdcAmt,
        status: "planned",
        detail: opp.executeHint,
      }),
    );
  }

  return {
    id: `job-${opp.id}`,
    title: opp.title,
    kind: opp.kind,
    status: "pending",
    steps,
    createdAt: new Date().toISOString(),
  };
}

export function compilePlanToJobs(
  opportunities: ExecutionOpportunity[],
): ExecutionJob[] {
  return opportunities
    .filter(
      (o) =>
        o.executable ||
        o.kind === "arbitrage" ||
        o.kind === "portfolio_rebalance",
    )
    .slice(0, 8)
    .map(compileOpportunityToJob);
}
