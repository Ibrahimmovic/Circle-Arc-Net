/** User goal: spend asset A on chain X, receive asset B on chain Y. */
export interface CrossChainIntent {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

export type IntentStrategy =
  | "lifi_one_shot"
  | "circle_cctp"
  | "cctp_then_swap"
  | "same_chain"
  | "unavailable";

export interface IntentRouteStep {
  order: number;
  label: string;
  chain?: string;
  automated: boolean;
}

export interface IntentRoutePlan {
  intent: CrossChainIntent;
  strategy: IntentStrategy;
  /** Plain English, e.g. "1 wallet confirm — LI.FI routes bridge + swap" */
  summary: string;
  estimatedWalletSteps: number;
  steps: IntentRouteStep[];
  signChain: string;
  lifi?: {
    fromChainId: number;
    toChainId: number;
    tool?: string;
    toAmountMin?: string;
    hasTransaction: boolean;
  };
  savingsNote?: string;
  fallbackHint?: string;
}
