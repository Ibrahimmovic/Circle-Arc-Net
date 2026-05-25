/** LiFi-verified testnet token addresses (from li.quest/v1/tokens). */

export const LIFI_TESTNET_TOKENS: Record<
  number,
  Record<string, { address: string; decimals: number; symbol: string }>
> = {
  5042002: {
    USDC: {
      address: "0x3600000000000000000000000000000000000000",
      decimals: 6,
      symbol: "USDC",
    },
    EURC: {
      address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      decimals: 6,
      symbol: "EURC",
    },
  },
  84532: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH",
    },
    USDC: {
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      decimals: 6,
      symbol: "USDC",
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      symbol: "WETH",
    },
  },
  11155111: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH",
    },
    USDC: {
      address: "0x94a9D9AC0a225Fb34a2c79dd2aF583bfFDDe3Ed0",
      decimals: 6,
      symbol: "USDC",
    },
    WETH: {
      address: "0xfff9976782d46b82556a8536b9925a3af0bb5e3b",
      decimals: 18,
      symbol: "WETH",
    },
  },
  421614: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH",
    },
    USDC: {
      address: "0x75faf114eafb1BDbe2F05490Efd5AD74ac889A56",
      decimals: 6,
      symbol: "USDC",
    },
    WETH: {
      address: "0x980B62Da83eFf3D4576C6489938De1e5E8e6A155",
      decimals: 18,
      symbol: "WETH",
    },
  },
};

/** Prefer symbol for LiFi quotes (resolves correct address server-side). */
export function lifiTokenParam(chainId: number, symbol: string): string {
  const chain = LIFI_TESTNET_TOKENS[chainId];
  const entry = chain?.[symbol.toUpperCase()];
  if (entry) return entry.symbol;
  return symbol;
}

export function syncTokenFromLifi(
  chainId: number,
  symbol: string,
): { address: string; decimals: number } | null {
  const entry = LIFI_TESTNET_TOKENS[chainId]?.[symbol.toUpperCase()];
  if (!entry) return null;
  return { address: entry.address, decimals: entry.decimals };
}
