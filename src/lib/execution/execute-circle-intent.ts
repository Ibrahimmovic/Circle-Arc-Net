import { AppKit } from "@circle-fin/app-kit";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { createWalletViemAdapter, executeCircleBridge } from "@/lib/circle-bridge-exec";
import { ensureCctpUsdcAllowance } from "@/lib/cctp-usdc-approve";
import { getBridgeKitConfig, getBridgeDestination } from "@/lib/kit-operations";
import { debitArcPlatformFee } from "@/lib/arc-platform-fee";
import { switchWalletToChain } from "@/lib/wallet-chain";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import type { CrossChainIntent } from "@/lib/execution/intent-types";
import { bridgeSubmitStatus } from "@/lib/bridge-status";

export async function executeCircleDirectIntent(params: {
  intent: CrossChainIntent;
  fromAddress: string;
  testnet: boolean;
  onProgress?: (msg: string) => void;
}): Promise<{ ok: boolean; message: string; burnTx?: string }> {
  const { intent, fromAddress, testnet, onProgress } = params;
  if (intent.fromToken !== "USDC" || intent.toToken !== "USDC") {
    throw new Error("Circle Direct is for USDC → USDC only.");
  }
  if (intent.fromChain === intent.toChain) {
    throw new Error("Pick different chains for a bridge.");
  }

  installCircleProxyFetch();
  if (testnet) {
    onProgress?.("Arc platform fee…");
    const fee = await debitArcPlatformFee(fromAddress);
    if (!fee.ok) throw new Error(fee.message);
  }

  const signChainId = wagmiChainIdForAppKit(intent.fromChain);
  if (!signChainId) throw new Error("Unsupported source chain.");
  await switchWalletToChain(signChainId);

  const kit = new AppKit();
  const adapter = await createWalletViemAdapter();
  onProgress?.("Approve USDC for CCTP…");
  const { skipped } = await ensureCctpUsdcAllowance(
    fromAddress,
    intent.fromChain,
    intent.amount,
    onProgress,
  );

  onProgress?.("Confirm bridge in wallet…");
  const mode = testnet ? "testnet" : "mainnet";
  const { result, capture } = await executeCircleBridge(
    kit,
    {
      from: { adapter, chain: intent.fromChain as never },
      to: getBridgeDestination(intent.toChain, adapter, mode) as never,
      amount: intent.amount,
      config: getBridgeKitConfig(!testnet),
      token: "USDC",
    },
    onProgress,
    { preApproved: !skipped },
  );

  const { label } = bridgeSubmitStatus(result.state, Boolean(capture.burnTx));

  return {
    ok: true,
    message: label,
    burnTx: capture.burnTx,
  };
}
