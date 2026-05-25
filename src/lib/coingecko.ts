export interface MarketSnapshot {
  btcChange24h: number;
  ethChange24h: number;
  usdcPrice: number;
  updatedAt: string;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image: string;
  sparkline: number[];
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin&vs_currencies=usd&include_24hr_change=true";

  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

  const data = (await res.json()) as {
    bitcoin?: { usd?: number; usd_24h_change?: number };
    ethereum?: { usd?: number; usd_24h_change?: number };
    "usd-coin"?: { usd?: number };
  };

  return {
    btcChange24h: data.bitcoin?.usd_24h_change ?? 0,
    ethChange24h: data.ethereum?.usd_24h_change ?? 0,
    usdcPrice: data["usd-coin"]?.usd ?? 1,
    updatedAt: new Date().toISOString(),
  };
}

/** Top coins for market strip (CoinGecko markets API). */
export async function getTopCoins(limit = 12): Promise<CoinMarket[]> {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(limit));
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString(), { next: { revalidate: 180 } });
  if (!res.ok) throw new Error(`CoinGecko markets ${res.status}`);

  const rows = (await res.json()) as Array<{
    id: string;
    symbol: string;
    name: string;
    current_price?: number;
    price_change_percentage_24h?: number;
    image?: string;
    sparkline_in_7d?: { price?: number[] };
  }>;

  return rows.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    image: c.image ?? "",
    sparkline: (c.sparkline_in_7d?.price ?? []).slice(-24),
  }));
}

/** ETH 7d sparkline for execute route cards. */
export async function getEthSparkline(): Promise<number[]> {
  const coins = await getTopCoins(3);
  const eth = coins.find((c) => c.id === "ethereum");
  return eth?.sparkline?.length ? eth.sparkline : syntheticSparkline(0.5);
}

export function syntheticSparkline(trend: number, points = 24): number[] {
  const base = 100;
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v += (Math.random() - 0.45 + trend * 0.02) * 2;
    out.push(v);
  }
  return out;
}
