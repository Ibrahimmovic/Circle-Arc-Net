import type { AppKit, BridgeParams, BridgeResult } from "@circle-fin/app-kit";
import { withTimeout } from "@/lib/wallet-chain";

function txHashFromBridgeEvent(payload: unknown): string | undefined {
  const p = payload as { values?: { txHash?: string } };
  return p?.values?.txHash;
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

/**
 * Circle `kit.bridge()` can stay pending while CCTP attestation/mint runs (~15 min SLOW).
 * Resolve the UI once the user has signed approve/burn, not when mint completes.
 */
export async function executeCircleBridge(
  kit: AppKit,
  params: BridgeParams,
  onStep?: (msg: string) => void,
): Promise<BridgeResult> {
  const amount = String(params.amount ?? "");
  let burnTx: string | undefined;

  const onApprove = () =>
    onStep?.("Wallet: approve USDC on source chain (if prompted)…");
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

  const full = kit.bridge(params);

  const afterBurn = (async (): Promise<BridgeResult> => {
    for (let i = 0; i < 400; i++) {
      if (burnTx) {
        try {
          return await withTimeout(full, 25_000, "CCTP settlement");
        } catch {
          return pendingBridgeResult(amount, burnTx);
        }
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("Bridge wallet steps timed out — open your wallet or try again.");
  })();

  try {
    return await Promise.race([
      full,
      afterBurn,
      withTimeout(full, 120_000, "Circle bridge"),
    ]);
  } catch (e) {
    if (burnTx) {
      onStep?.(
        `Bridge submitted · burn ${burnTx.slice(0, 10)}… — check Arcscan / destination explorer.`,
      );
      return pendingBridgeResult(amount, burnTx);
    }
    throw e;
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
