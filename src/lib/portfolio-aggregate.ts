import { canonicalChainKey } from "@/lib/portfolio-engine";
import type {
  AggregatedAsset,
  NftCollectionGroup,
  PortfolioActivity,
  PortfolioAsset,
  PortfolioNft,
} from "@/lib/portfolio-wallet-types";

export function aggregateAssetsBySymbol(
  assets: PortfolioAsset[],
): AggregatedAsset[] {
  const map = new Map<string, AggregatedAsset>();

  for (const a of assets) {
    if (a.isSpam) continue;
    const sym = a.symbol.toUpperCase();
    const prev = map.get(sym);
    if (!prev) {
      map.set(sym, {
        symbol: a.symbol,
        name: a.name,
        logoUrl: a.logoUrl,
        valueUsd: a.valueUsd,
        priceUsd: a.priceUsd,
        change24hPct: a.change24hPct,
        networkCount: 1,
        networks: [a.chain],
        holdings: [a],
      });
      continue;
    }
    const networks = new Set([...prev.networks, a.chain]);
    prev.valueUsd += a.valueUsd;
    prev.networks = [...networks];
    prev.networkCount = networks.size;
    prev.holdings.push(a);
    if ((a.priceUsd ?? 0) > (prev.priceUsd ?? 0)) prev.priceUsd = a.priceUsd;
    if (a.logoUrl && !prev.logoUrl) prev.logoUrl = a.logoUrl;
    if (Math.abs(a.change24hPct) > Math.abs(prev.change24hPct)) {
      prev.change24hPct = a.change24hPct;
    }
  }

  return [...map.values()].sort((a, b) => b.valueUsd - a.valueUsd);
}

export function groupNftCollections(nfts: PortfolioNft[]): NftCollectionGroup[] {
  const map = new Map<string, NftCollectionGroup>();

  for (const n of nfts) {
    if (n.isSpam) continue;
    const key = `${n.chain}:${(n.collection ?? n.name).toLowerCase()}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        id: key,
        name: n.collection ?? n.name,
        chain: n.chain,
        imageUrl: n.imageUrl,
        count: n.amount,
        floorUsd: n.floorUsd,
        items: [n],
      });
    } else {
      prev.count += n.amount;
      prev.items.push(n);
      if ((n.floorUsd ?? 0) > (prev.floorUsd ?? 0)) prev.floorUsd = n.floorUsd;
      if (!prev.imageUrl && n.imageUrl) prev.imageUrl = n.imageUrl;
    }
  }

  return [...map.values()].sort(
    (a, b) => (b.floorUsd ?? 0) * b.count - (a.floorUsd ?? 0) * a.count,
  );
}

export function chainBalancesFromDistribution(
  distribution: Record<string, number>,
  totalUsd: number,
  labelFn: (id: string) => string,
): Array<{ chain: string; chainId: string; valueUsd: number; percent: number }> {
  return Object.entries(distribution)
    .map(([chainId, valueUsd]) => ({
      chain: labelFn(chainId),
      chainId: canonicalChainKey(chainId),
      valueUsd,
      percent: totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0,
    }))
    .filter((c) => c.valueUsd >= 0.01)
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

export function enrichActivityDisplay(tx: PortfolioActivity): PortfolioActivity {
  const type = tx.type.toLowerCase();
  let displayType = tx.type;
  if (type.includes("send") || tx.direction === "out") displayType = "Send";
  else if (type.includes("receive") || tx.direction === "in") displayType = "Receive";
  else if (type.includes("trade") || type.includes("swap")) displayType = "Trade";
  else if (type.includes("approve")) displayType = "Approve";
  else if (type === "execute" || type.includes("contract")) displayType = "Execute";

  return { ...tx, displayType };
}
