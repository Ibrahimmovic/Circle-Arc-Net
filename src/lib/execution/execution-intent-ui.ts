import type { CrossChainIntent } from "@/lib/execution/intent-types";

export type ExecutionKind =
  | "full" /** different token and/or cross-chain outcome */
  | "transfer" /** same token, move chain */
  | "same_chain" /** swap on one chain */
  | "arbitrary";

export interface ExecutionPipelineStep {
  id: string;
  label: string;
  detail: string;
  status: "pending" | "active" | "done";
}

export function classifyExecution(
  fromChain: string,
  toChain: string,
  fromToken: string,
  toToken: string,
): ExecutionKind {
  const sameChain = fromChain === toChain;
  const sameToken = fromToken.toUpperCase() === toToken.toUpperCase();
  if (sameChain && !sameToken) return "same_chain";
  if (!sameChain && sameToken) return "transfer";
  return "full";
}

export function intentSentence(
  intent: CrossChainIntent,
  fromLabel: string,
  toLabel: string,
): string {
  const kind = classifyExecution(
    intent.fromChain,
    intent.toChain,
    intent.fromToken,
    intent.toToken,
  );
  const amt = intent.amount || "…";
  if (kind === "transfer") {
    return `Move ${amt} ${intent.fromToken} from ${fromLabel} → ${toLabel} (position migration).`;
  }
  if (kind === "same_chain") {
    return `On ${fromLabel}: convert ${amt} ${intent.fromToken} into ${intent.toToken}.`;
  }
  return `Execute on ${toLabel}: receive ${intent.toToken} using ${amt} ${intent.fromToken} from ${fromLabel} (bridge + convert + deliver in one flow).`;
}

export function buildExecutionPipeline(
  fromChain: string,
  toChain: string,
  fromToken: string,
  toToken: string,
  fromLabel: string,
  toLabel: string,
): ExecutionPipelineStep[] {
  const kind = classifyExecution(fromChain, toChain, fromToken, toToken);

  if (kind === "transfer") {
    return [
      {
        id: "1",
        label: "Debit source",
        detail: `Lock ${fromToken} on ${fromLabel}`,
        status: "pending",
      },
      {
        id: "2",
        label: "Cross-chain rail",
        detail: `Burn / mint or relay to ${toLabel}`,
        status: "pending",
      },
      {
        id: "3",
        label: "Credit wallet",
        detail: `${toToken} available on ${toLabel}`,
        status: "pending",
      },
    ];
  }

  if (kind === "same_chain") {
    return [
      {
        id: "1",
        label: "Debit source",
        detail: `Spend ${fromToken} on ${fromLabel}`,
        status: "pending",
      },
      {
        id: "2",
        label: "Swap & settle",
        detail: `Deliver ${toToken} on same chain`,
        status: "pending",
      },
    ];
  }

  return [
    {
      id: "1",
      label: "Debit source",
      detail: `Use ${fromToken} on ${fromLabel}`,
      status: "pending",
    },
    {
      id: "2",
      label: "Route cross-chain",
      detail: `Bridge liquidity ${fromLabel} → ${toLabel}`,
      status: "pending",
    },
    {
      id: "3",
      label: "Convert & deliver",
      detail: `Mint / swap into ${toToken} at destination`,
      status: "pending",
    },
    {
      id: "4",
      label: "Complete",
      detail: `${toToken} in your wallet on ${toLabel}`,
      status: "pending",
    },
  ];
}
