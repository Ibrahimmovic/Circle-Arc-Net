import { getMarketSnapshot, getTopCoins } from "@/lib/coingecko";
import { parseBalanceString } from "@/lib/portfolio-display";
import { capUsd, sanitizeAssetUsd } from "@/lib/portfolio-valuation";
import type { PortfolioAsset } from "@/lib/portfolio-wallet-types";
import { VERIFIED_TOKEN_SYMBOLS } from "@/lib/token-visuals";

/** CoinGecko id by ticker — extends coverage beyond top-100 markets list */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  ETH: "ethereum",
  WETH: "weth",
  USDC: "usd-coin",
  USDT: "tether",
  DAI: "dai",
  WBTC: "wrapped-bitcoin",
  BTC: "bitcoin",
  BNB: "binancecoin",
  MATIC: "matic-network",
  POL: "matic-network",
  AVAX: "avalanche-2",
  OP: "optimism",
  ARB: "arbitrum",
  ZORA: "zora",
  AERO: "aerodrome-finance",
  KAITO: "kaito",
  W: "wormhole",
  ENA: "ethena",
  EZETH: "renzo-restaked-eth",
  CBETH: "coinbase-wrapped-staked-eth",
  STETH: "staked-ether",
  RETH: "rocket-pool-eth",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  CRV: "curve-dao-token",
  GMX: "gmx",
  GRAVITY: "g-token",
  G: "g-token",
};

export type MarketQuote = {
  price: number;
  change24h: number;
  image?: string;
};

export async function buildSymbolMarketMap(
  extraSymbols: string[],
): Promise<Map<string, MarketQuote>> {
  const map = new Map<string, MarketQuote>();

  try {
    const top = await getTopCoins(80);
    for (const c of top) {
      map.set(c.symbol.toUpperCase(), {
        price: c.price,
        change24h: c.change24h,
        image: c.image,
      });
    }
  } catch {
    /* optional */
  }

  const ids = new Set<string>();
  for (const sym of extraSymbols) {
    const id = SYMBOL_TO_COINGECKO_ID[sym.toUpperCase()];
    if (id) ids.add(id);
  }
  ids.add("ethereum");
  ids.add("usd-coin");

  if (ids.size > 0) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${[...ids].join(",")}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as Record<
          string,
          { usd?: number; usd_24h_change?: number }
        >;
        const idToImage: Record<string, string> = {};
        try {
          const meta = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${[...ids].slice(0, 50).join(",")}&per_page=50`,
            { cache: "no-store" },
          );
          if (meta.ok) {
            const rows = (await meta.json()) as Array<{ id: string; image?: string }>;
            for (const r of rows) {
              if (r.image) idToImage[r.id] = r.image;
            }
          }
        } catch {
          /* optional */
        }

        for (const [sym, cgId] of Object.entries(SYMBOL_TO_COINGECKO_ID)) {
          const row = data[cgId];
          if (!row?.usd) continue;
          const prev = map.get(sym);
          map.set(sym, {
            price: row.usd,
            change24h: row.usd_24h_change ?? prev?.change24h ?? 0,
            image: prev?.image ?? idToImage[cgId],
          });
        }
        const eth = data.ethereum;
        if (eth?.usd) {
          map.set("ETH", {
            price: eth.usd,
            change24h: eth.usd_24h_change ?? 0,
            image: map.get("ETH")?.image,
          });
          map.set("WETH", {
            price: eth.usd,
            change24h: eth.usd_24h_change ?? 0,
            image: map.get("WETH")?.image,
          });
        }
      }
    } catch {
      /* optional */
    }
  }

  try {
    const snap = await getMarketSnapshot();
    map.set("USDC", {
      price: snap.usdcPrice,
      change24h: 0,
      image: map.get("USDC")?.image,
    });
    if (!map.has("ETH")) {
      map.set("ETH", {
        price: 0,
        change24h: snap.ethChange24h,
      });
    } else {
      const e = map.get("ETH")!;
      map.set("ETH", { ...e, change24h: snap.ethChange24h || e.change24h });
    }
  } catch {
    /* optional */
  }

  return map;
}

export function enrichAssetsWithMarketData(
  assets: PortfolioAsset[],
  market: Map<string, MarketQuote>,
): PortfolioAsset[] {
  return assets.map((a) => {
    const sym = a.symbol.toUpperCase();
    const q = market.get(sym);
    const isVerified = VERIFIED_TOKEN_SYMBOLS.has(sym);
    const balNum = parseBalanceString(a.balance);

    let priceUsd = a.priceUsd && a.priceUsd > 0 ? a.priceUsd : q?.price;
    let valueUsd = capUsd(a.valueUsd);

    // Only price from CoinGecko for verified tickers — avoids spam "USDC" inflation
    if (
      isVerified &&
      q?.price &&
      valueUsd < 0.01 &&
      balNum != null &&
      balNum > 0
    ) {
      valueUsd = capUsd(balNum * (priceUsd ?? q.price));
    }

    valueUsd = sanitizeAssetUsd(a.symbol, valueUsd, a.balance, priceUsd);

    const change24hPct =
      Math.abs(a.change24hPct) > 0.001
        ? a.change24hPct
        : (q?.change24h ?? a.change24hPct);

    return {
      ...a,
      logoUrl: a.logoUrl ?? (isVerified ? q?.image : undefined),
      priceUsd,
      valueUsd,
      change24hPct,
      unverified: valueUsd < 0.01 && (balNum ?? 0) > 0 && !isVerified,
    };
  });
}
