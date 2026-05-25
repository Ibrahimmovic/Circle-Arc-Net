import type { AppKit, BridgeParams, BridgeResult } from "@circle-fin/app-kit";
import { withTimeout } from "@/lib/wallet-chain";

function txHashFromBridgeEvent(payload: unknown): string | undefined {
  const p = payload as { values?: { txHash?: string } };
  return p?.values?.txHash;
}

export interface BridgeCapture {
  approveTx?: string;
  burnTx?: string;
  /** True when approve was not a separate wallet signature (batch/permit/already allowed). */
  approveBundled?: boolean;
}

function pendingBridgeResult(amount: string, burnTx: string): BridgeResult {
  return {
    state: "pending",
    amount,
    token: "USDC",
    provider: "CCTP",
    source: {
      address: "",
      chain: { name: "source" } as BridgeResult["source"]["chain"],
    },
    destination: {
      address: "",
      chain: { name: "destination" } as BridgeResult["destination"]["chain"],
    },
    steps: [
      {
        name: "burn",
        state: "success",
        txHash: burnTx,
      } as BridgeResult["steps"][number],
    ],
  };
}

const BURN_WAIT_MS = 180_000;
const BURN_POLL_MS = 250;

/**
 * Circle `kit.bridge()` can stay pending while CCTP attestation/mint runs (~15 min SLOW).
 * Resolve the UI once the user has signed burn, not when mint completes.
 * Do not treat kit "error" as failure if burn tx is already on-chain.
 */
export async function executeCircleBridge(
  kit: AppKit,
  params: BridgeParams,
  onStep?: (msg: string) => void,
  options?: { preApproved?: boolean },
): Promise<{ result: BridgeResult; capture: BridgeCapture }> {
  const amount = String(params.amount ?? "");
  let burnTx: string | undefined;
  let kitApproveTx: string | undefined;

  const onApprove = (payload: unknown) => {
    const h = txHashFromBridgeEvent(payload);
    if (h) kitApproveTx = h;
    if (!options?.preApproved) {
      onStep?.(
        "Wallet: approve USDC — MetaMask will ask how much USDC the bridge can spend.",
      );
    }
  };
  const onBurn = (payload: unknown) => {
    const h = txHashFromBridgeEvent(payload);
    if (h) {
      burnTx = h;
      onStep?.(
        `Burn signed · ${h.slice(0, 10)}… Circle will mint on destination (~15 min SLOW CCTP).`,
      );
    }
  };

  kit.on("bridge.approve", onApprove);
  kit.on("bridge.burn", onBurn as never);

  try {
  onStep?.("Wallet: confirm bridge burn on source chain…");

  const full = kit.bridge(params);

  const started = Date.now();
  while (Date.now() - started < BURN_WAIT_MS) {
    if (burnTx) {
      try {
        const settled = await withTimeout(full, 30_000, "CCTP settlement");
        return {
          result: settled,
          capture: {
            approveTx: kitApproveTx,
            burnTx,
            approveBundled: false,
          },
        };
      } catch {
        return {
          result: pendingBridgeResult(amount, burnTx),
          capture: {
            approveTx: kitApproveTx,
            burnTx,
            approveBundled: false,
          },
        };
      }
    }
    await new Promise((r) => setTimeout(r, BURN_POLL_MS));
  }

  let kitResult: BridgeResult | undefined;
  try {
    kitResult = await withTimeout(full, 5_000, "Circle bridge finalize");
  } catch {
    /* use kitResult undefined */
  }

  if (burnTx) {
    return {
      result: kitResult ?? pendingBridgeResult(amount, burnTx),
      capture: { approveTx: kitApproveTx, burnTx, approveBundled: false },
    };
  }

  if (kitApproveTx && !burnTx) {
    throw new Error(
      "USDC approve confirmed but bridge burn did not start. Stay on the source chain, open your wallet, and click Exchange again — only the burn step should appear.",
    );
  }

  const state = String(kitResult?.state ?? "error").toLowerCase();
  if (state === "error" || state === "failed") {
    throw new Error(
      "Bridge burn was not confirmed. Check wallet is on the source chain and try Exchange again.",
    );
  }

  throw new Error(
    "Bridge timed out waiting for burn — confirm the burn transaction in your wallet or retry.",
  );
  } finally {
    kit.off("bridge.approve", onApprove);
    kit.off("bridge.burn", onBurn as never);
  }
}

export async function createWalletViemAdapter() {
  if (!window.ethereum) throw new Error("Connect wallet");
  const { createViemAdapterFromProvider } = await import(
    "@circle-fin/adapter-viem-v2"
  );
  return createViemAdapterFromProvider({ provider: window.ethereum as never });
}
