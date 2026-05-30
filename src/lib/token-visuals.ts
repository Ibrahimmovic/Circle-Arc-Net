/** Token & chain visuals for execute UI */

export const TOKEN_ICONS: Record<string, string> = {
  USDC: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  EURC: "https://assets.coingecko.com/coins/images/26045/large/euro.png",
  ETH: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  WETH: "https://assets.coingecko.com/coins/images/2518/large/weth.png",
  BTC: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  WBTC: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  DAI: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  XRP: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
  TRX: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
  ZORA: "https://assets.coingecko.com/coins/images/34653/large/zora.png",
  cbETH: "https://assets.coingecko.com/coins/images/27008/large/cbeth.png",
  AERO: "https://assets.coingecko.com/coins/images/31745/large/token.png",
  KAITO: "https://assets.coingecko.com/coins/images/37082/large/kaito.png",
  W: "https://assets.coingecko.com/coins/images/35087/large/womrhole_logo_full_color_1.png",
  ENA: "https://assets.coingecko.com/coins/images/36530/large/ethena.png",
  EZETH: "https://assets.coingecko.com/coins/images/34753/large/EzETH_Logo.png",
  RETH: "https://assets.coingecko.com/coins/images/20764/large/reth.png",
  OP: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/large/arb.jpg",
  MATIC: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
};

/** Never auto-flag as spam — known liquid / verified tickers */
export const VERIFIED_TOKEN_SYMBOLS = new Set([
  ...Object.keys(TOKEN_ICONS),
  "CBETH",
  "STETH",
  "RETH",
  "WEETH",
  "USDBC",
  "USDbC",
  "CBBTC",
]);

export const CHAIN_ICONS: Record<string, string> = {
  Arc_Testnet: "https://docs.arc.network/favicon.ico",
  "Arc Testnet": "https://docs.arc.network/favicon.ico",
  Base_Sepolia: "https://assets.coingecko.com/coins/images/27958/large/base.png",
  Ethereum_Sepolia: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  Arbitrum_Sepolia: "https://assets.coingecko.com/coins/images/16547/large/arb.jpg",
  Optimism_Sepolia: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
  Ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  Base: "https://assets.coingecko.com/coins/images/27958/large/base.png",
  Arbitrum: "https://assets.coingecko.com/coins/images/16547/large/arb.jpg",
  Optimism: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
  OP: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png",
  Polygon: "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  Avalanche: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
  "BNB Chain": "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  BSC: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
  Linea: "https://assets.coingecko.com/coins/images/33904/large/linea.png",
  Scroll: "https://assets.coingecko.com/coins/images/26928/large/scroll.png",
  Mantle: "https://assets.coingecko.com/coins/images/30980/large/mantle.jpg",
  Zora: "https://assets.coingecko.com/coins/images/34653/large/zora.png",
  Blast: "https://assets.coingecko.com/coins/images/35494/large/blast.jpg",
  Taiko: "https://assets.coingecko.com/coins/images/38058/large/icon.png",
  Ronin: "https://assets.coingecko.com/coins/images/14113/large/ronin.png",
  ZetaChain: "https://assets.coingecko.com/coins/images/26718/large/Twitter_icon.png",
  Gravity: "https://assets.coingecko.com/coins/images/39200/large/gravity.jpg",
  Abstract: "https://assets.coingecko.com/coins/images/37082/large/kaito.png",
  "Manta Pacific": "https://assets.coingecko.com/coins/images/28452/large/manta.png",
  opBNB: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
};

export const ARC_FEE_COPY =
  "Every action debits 0.01 USDC on Arc Testnet first — then your swap/bridge signs.";

export const ARC_BRIDGE_STEPS_COPY =
  "Arc bridge: 3 wallet steps — (1) platform fee, (2) approve USDC limit, (3) bridge burn.";

export function tokenIcon(symbol: string): string | undefined {
  const key = symbol.toUpperCase();
  return TOKEN_ICONS[key] ?? TOKEN_ICONS[symbol];
}

export function resolveTokenLogo(
  symbol: string,
  apiUrl?: string | null,
  isNative?: boolean,
): string | undefined {
  if (apiUrl) return apiUrl;
  if (isNative || symbol.toUpperCase() === "ETH") return TOKEN_ICONS.ETH;
  return tokenIcon(symbol);
}

export function chainIcon(chainName: string): string | undefined {
  if (!chainName) return undefined;
  const direct = CHAIN_ICONS[chainName];
  if (direct) return direct;
  const lower = chainName.toLowerCase();
  for (const [key, url] of Object.entries(CHAIN_ICONS)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase())) {
      return url;
    }
  }
  if (lower.includes("base")) return CHAIN_ICONS.Base;
  if (lower.includes("eth")) return CHAIN_ICONS.Ethereum;
  if (lower.includes("arb")) return CHAIN_ICONS.Arbitrum;
  if (lower.includes("optim") || lower === "op") return CHAIN_ICONS.Optimism;
  if (lower.includes("polygon") || lower.includes("matic")) return CHAIN_ICONS.Polygon;
  if (lower.includes("bnb") || lower.includes("bsc")) return CHAIN_ICONS["BNB Chain"];
  return undefined;
}
