/** Portfolio data provider roles (testnet + mainnet). */
export const PORTFOLIO_PROVIDER_MATRIX = [
  { feature: "Portfolio balances", api: "Zerion", envKey: "ZERION_API_KEY" },
  { feature: "Transaction history", api: "Alchemy", envKey: "ALCHEMY_API_KEY" },
  { feature: "Scam detection", api: "GoPlus", envKey: "GOPLUS_API_KEY" },
  { feature: "Prices", api: "CoinGecko", envKey: null },
  { feature: "Analytics", api: "Dune", envKey: "DUNE_API_KEY" },
  { feature: "Backup wallet data", api: "Covalent", envKey: "GOLDRUSH_API_KEY" },
] as const;

export type PortfolioProviderStatus = {
  zerion: boolean;
  alchemy: boolean;
  goplus: boolean;
  coingecko: boolean;
  dune: boolean;
  covalent: boolean;
};

export function readPortfolioProviderStatus(): PortfolioProviderStatus {
  return {
    zerion: Boolean(process.env.ZERION_API_KEY?.trim()),
    alchemy: Boolean(process.env.ALCHEMY_API_KEY?.trim()),
    goplus: Boolean(
      process.env.GOPLUS_API_KEY?.trim() && process.env.GOPLUS_API_SECRET?.trim(),
    ),
    coingecko: true,
    dune: Boolean(process.env.DUNE_API_KEY?.trim()),
    covalent: Boolean(process.env.GOLDRUSH_API_KEY?.trim()),
  };
}

export function portfolioDataSourceLabel(status: PortfolioProviderStatus): string {
  const parts: string[] = [];
  if (status.zerion) parts.push("Zerion");
  if (status.covalent) parts.push("Covalent");
  if (status.alchemy) parts.push("Alchemy");
  if (status.goplus) parts.push("GoPlus");
  parts.push("CoinGecko");
  if (status.dune) parts.push("Dune");
  return parts.join(" + ");
}
