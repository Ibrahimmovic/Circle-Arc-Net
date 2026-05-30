/** LiFi quote for external_bridge rail (no API key required for public quotes). */

const LIFI_CHAIN_IDS: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Polygon: 137,
  Optimism: 10,
};

const USDC_BY_CHAIN: Record<string, string> = {
  Ethereum: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  Base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  Arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  Polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  Optimism: "0x0b2C639c533813f4Aa9D7837BAf67058d5321d39",
};

export async function fetchLifiBridgeQuote(params: {
  fromChain: string;
  toChain: string;
  fromAddress: string;
  amountUsd: string;
}): Promise<{ estimateUsd?: number; tool?: string; note: string }> {
  const fromId = LIFI_CHAIN_IDS[params.fromChain];
  const toId = LIFI_CHAIN_IDS[params.toChain];
  const fromToken = USDC_BY_CHAIN[params.fromChain];
  const toToken = USDC_BY_CHAIN[params.toChain];

  if (!fromId || !toId || !fromToken || !toToken) {
    return { note: "Chain not in LiFi USDC map — use CCTP routes." };
  }

  const amountWei = BigInt(Math.floor(parseFloat(params.amountUsd) * 1e6));

  try {
    const qs = new URLSearchParams({
      fromChain: String(fromId),
      toChain: String(toId),
      fromToken,
      toToken,
      fromAddress: params.fromAddress,
      fromAmount: amountWei.toString(),
      toAddress: params.fromAddress,
    });
    const res = await fetch(`https://li.quest/v1/quote?${qs}`);
    const data = await res.json();
    if (!res.ok) {
      return { note: data.message ?? "LiFi quote unavailable" };
    }
    return {
      estimateUsd: Number(data.estimate?.toAmountUSD ?? 0) / 1e6,
      tool: data.tool,
      note: "LiFi route found — execute via wallet on li.fi widget (external rail).",
    };
  } catch (e) {
    return {
      note: e instanceof Error ? e.message : "LiFi fetch failed",
    };
  }
}
