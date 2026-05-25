/** Token & chain visuals for Jumper-style execute UI */

export const TOKEN_ICONS: Record<string, string> = {
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  EURC: "https://assets.coingecko.com/coins/images/26045/small/euro.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  WETH: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ZORA: "https://assets.coingecko.com/coins/images/34653/small/zora.png",
  DAI: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  WBTC: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  cbETH: "https://assets.coingecko.com/coins/images/27008/small/cbeth.png",
  AERO: "https://assets.coingecko.com/coins/images/31745/small/token.png",
};

export const CHAIN_ICONS: Record<string, string> = {
  Arc_Testnet: "https://docs.arc.network/favicon.ico",
  Base_Sepolia: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  Ethereum_Sepolia: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  Arbitrum_Sepolia: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg",
  Optimism_Sepolia: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  Ethereum: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  Base: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  Arbitrum: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg",
};

export const ARC_FEE_COPY =
  "Every action debits 0.01 USDC on Arc Testnet first — then your swap/bridge signs.";

export const ARC_BRIDGE_STEPS_COPY =
  "Arc bridge: 3 wallet steps — (1) platform fee, (2) approve USDC limit, (3) bridge burn.";

export function tokenIcon(symbol: string): string | undefined {
  return TOKEN_ICONS[symbol.toUpperCase()] ?? TOKEN_ICONS[symbol];
}

export function chainIcon(appKitChain: string): string | undefined {
  return CHAIN_ICONS[appKitChain];
}
