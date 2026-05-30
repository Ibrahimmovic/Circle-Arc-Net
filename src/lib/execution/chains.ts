/** App Kit chain labels supported for CCTP in this app. */
export const CCTP_CHAINS = [
  "Ethereum",
  "Base",
  "Arbitrum",
  "Polygon",
  "Optimism",
] as const;

export type CctpChainName = (typeof CCTP_CHAINS)[number];

export function toCctpChain(name: string): CctpChainName {
  const clean = name
    .replace(/-mainnet$/i, "")
    .replace(/ testnet/gi, "")
    .trim();
  const map: Record<string, CctpChainName> = {
    ethereum: "Ethereum",
    eth: "Ethereum",
    base: "Base",
    arbitrum: "Arbitrum",
    arb: "Arbitrum",
    polygon: "Polygon",
    matic: "Polygon",
    optimism: "Optimism",
    op: "Optimism",
    arc: "Base",
  };
  const key = clean.toLowerCase();
  if (map[key]) return map[key];
  if ((CCTP_CHAINS as readonly string[]).includes(clean)) return clean as CctpChainName;
  return "Ethereum";
}

export function isCctpRoute(from: string, to: string): boolean {
  return toCctpChain(from) !== toCctpChain(to);
}

export function usdcAmountFromUsd(usd: number, cap = 50): string {
  const n = Math.max(1, Math.min(usd, cap));
  return n.toFixed(2);
}
