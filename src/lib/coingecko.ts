export interface MarketSnapshot {
  btcChange24h: number;
  ethChange24h: number;
  usdcPrice: number;
  updatedAt: string;
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
