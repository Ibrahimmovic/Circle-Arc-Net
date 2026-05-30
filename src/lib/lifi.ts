import { lifiTokenParam } from "@/lib/lifi-tokens";

/** LI.FI aggregator — server + client helpers */

export interface LifiQuoteParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress?: string;
}

export interface LifiTransactionRequest {
  to: string;
  data: string;
  value?: string;
  chainId?: number;
  gasLimit?: string;
}

export interface LifiQuoteResult {
  estimate?: {
    toAmount?: string;
    toAmountMin?: string;
  };
  action?: { fromToken?: { symbol?: string }; toToken?: { symbol?: string } };
  transactionRequest?: LifiTransactionRequest;
  tool?: string;
  error?: string;
}

const LIFI_BASE = "https://li.quest/v1";

export async function fetchLifiQuote(
  params: LifiQuoteParams,
): Promise<LifiQuoteResult> {
  const url = new URL(`${LIFI_BASE}/quote`);
  url.searchParams.set("fromChain", String(params.fromChain));
  url.searchParams.set("toChain", String(params.toChain));
  const fromTok =
    typeof params.fromToken === "string" && params.fromToken.startsWith("0x")
      ? params.fromToken
      : lifiTokenParam(params.fromChain, params.fromToken);
  const toTok =
    typeof params.toToken === "string" && params.toToken.startsWith("0x")
      ? params.toToken
      : lifiTokenParam(params.toChain, params.toToken);

  url.searchParams.set("fromToken", fromTok);
  url.searchParams.set("toToken", toTok);
  url.searchParams.set("fromAmount", params.fromAmount);
  url.searchParams.set("fromAddress", params.fromAddress);
  if (params.toAddress) {
    url.searchParams.set("toAddress", params.toAddress);
  }
  url.searchParams.set("integrator", "agora-forge");
  url.searchParams.set("slippage", "0.03");

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  const data = (await res.json()) as LifiQuoteResult & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `LiFi ${res.status}`);
  }
  return data;
}

export function formatLifiOutput(quote: LifiQuoteResult, toSymbol: string): string {
  const min = quote.estimate?.toAmountMin ?? quote.estimate?.toAmount;
  if (!min) return "—";
  return `~${min} ${toSymbol} (min)`;
}
