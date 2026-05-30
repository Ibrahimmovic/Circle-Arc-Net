import type { LifiQuoteResult } from "@/lib/lifi";
import { toBaseUnits } from "@/lib/execute-tokens";
import {
  findExecToken,
  getExecChain,
} from "@/lib/execution/chain-catalog";
import type { NetworkMode } from "@/lib/network";
import type { CrossChainIntent } from "@/lib/execution/intent-types";
import { debitArcPlatformFee } from "@/lib/arc-platform-fee";
import { chainIdToHex, switchWalletToChain, withTimeout } from "@/lib/wallet-chain";

export async function fetchIntentLifiQuote(
  intent: CrossChainIntent,
  fromAddress: string,
  mode: NetworkMode = "testnet",
): Promise<LifiQuoteResult> {
  const fromMeta = findExecToken(intent.fromChain, intent.fromToken, mode);
  const fromCfg = getExecChain(intent.fromChain, mode);
  const toCfg = getExecChain(intent.toChain, mode);
  if (!fromMeta || !fromCfg || !toCfg) {
    throw new Error("Unsupported chain or token.");
  }

  const qs = new URLSearchParams({
    fromChain: String(fromCfg.lifiChainId),
    toChain: String(toCfg.lifiChainId),
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    fromAmount: toBaseUnits(intent.amount, fromMeta.decimals),
    fromAddress,
    toAddress: fromAddress,
  });
  const res = await fetch(`/api/lifi/quote?${qs}`);
  const data = (await res.json()) as LifiQuoteResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Quote failed");
  return data;
}

export async function executeLifiIntent(params: {
  intent: CrossChainIntent;
  fromAddress: string;
  testnet: boolean;
  mode?: NetworkMode;
  onProgress?: (msg: string) => void;
}): Promise<{ txHash: string; tool?: string }> {
  const { intent, fromAddress, testnet, onProgress } = params;
  const mode = params.mode ?? (testnet ? "testnet" : "mainnet");

  if (testnet) {
    onProgress?.("Arc platform fee (0.01 USDC)…");
    const fee = await debitArcPlatformFee(fromAddress);
    if (!fee.ok) throw new Error(fee.message);
  }

  const fromCfg = getExecChain(intent.fromChain, mode);
  if (!fromCfg) throw new Error("Unsupported source chain.");

  onProgress?.("Fetching best route…");
  const quote = await fetchIntentLifiQuote(intent, fromAddress, mode);
  const tx = quote.transactionRequest;
  if (!tx?.to || !tx?.data) {
    throw new Error("No executable transaction — try another pair or amount.");
  }

  onProgress?.(`Confirm in wallet · ${quote.tool ?? "LI.FI"}`);
  await switchWalletToChain(fromCfg.wagmiChainId);

  const hash = (await withTimeout(
    (
      window.ethereum as {
        request: (args: { method: string; params: unknown[] }) => Promise<string>;
      }
    ).request({
      method: "eth_sendTransaction",
      params: [
        {
          chainId: chainIdToHex(fromCfg.wagmiChainId),
          from: fromAddress,
          to: tx.to,
          data: tx.data,
          value: tx.value ?? "0x0",
        },
      ],
    }),
    180_000,
    "Cross-chain intent",
  )) as string;

  return { txHash: hash, tool: quote.tool };
}
