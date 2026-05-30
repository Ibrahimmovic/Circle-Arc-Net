import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { CctpChainName } from "@/lib/execution/chains";
import type { ExecutionStep } from "@/lib/execution/types";

export async function getCircleAdapter() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Connect wallet to execute onchain.");
  }
  const kit = new AppKit();
  const adapter = await createViemAdapterFromProvider({
    provider: window.ethereum as Parameters<
      typeof createViemAdapterFromProvider
    >[0]["provider"],
  });
  return { kit, adapter };
}

export async function runCctpBridgeStep(
  step: ExecutionStep,
  onProgress?: (msg: string) => void,
): Promise<{ state?: string; txHint?: string }> {
  const from = step.fromChain as CctpChainName;
  const to = step.toChain as CctpChainName;
  if (!from || !to) throw new Error("Missing from/to chain");

  onProgress?.(`CCTP bridge ${from} → ${to} — confirm in wallet`);
  const { kit, adapter } = await getCircleAdapter();
  const result = await kit.bridge({
    from: { adapter, chain: from },
    to: { adapter, chain: to },
    amount: step.amount,
  });
  return {
    state: typeof result.state === "string" ? result.state : "submitted",
    txHint: "Circle App Kit bridge",
  };
}

export async function runCircleSwapStep(
  step: ExecutionStep,
  kitKey: string | undefined,
  onProgress?: (msg: string) => void,
): Promise<{ state?: string }> {
  if (!kitKey?.trim()) {
    throw new Error("NEXT_PUBLIC_CIRCLE_KIT_KEY required for Circle swap.");
  }
  const chain = step.fromChain as CctpChainName;
  if (!chain) throw new Error("Missing chain for swap");

  onProgress?.(`Swap on ${chain} — confirm in wallet`);
  const { kit, adapter } = await getCircleAdapter();
  const tokenIn = (step.token === "EURC" ? "EURC" : "USDC") as "USDC" | "EURC";
  const tokenOut = (step.toToken === "EURC" ? "EURC" : "USDC") as "USDC" | "EURC";

  await kit.swap({
    from: { adapter, chain },
    tokenIn,
    tokenOut,
    amountIn: step.amount,
    config: {
      kitKey: kitKey.trim(),
      slippageBps: 300,
      allowanceStrategy: "permit",
    },
  });
  return { state: "submitted" };
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
