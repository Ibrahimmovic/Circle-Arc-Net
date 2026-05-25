import { getArcTestnetUsdBalances } from "@/lib/arc-balance";
import {
  aggregateGoldRushByChain,
  getBalancesForNetworkMode,
  type GoldRushTokenBalance,
} from "@/lib/goldrush";
import { analyzePortfolio, mergeChainData } from "@/lib/portfolio-engine";
import type { PortfolioAnalysis } from "@/lib/types";
import {
  getWalletNftPositions,
  getWalletPortfolio,
  getWalletPositions,
  getWalletTransactions,
  type ZerionNftPosition,
  type ZerionPosition,
  type ZerionTransaction,
} from "@/lib/zerion";
import type {
  PortfolioActivity,
  PortfolioAsset,
  PortfolioNft,
  PortfolioWalletFeed,
} from "@/lib/portfolio-wallet-types";

function formatChainLabel(id: string): string {
  const map: Record<string, string> = {
    ethereum: "Ethereum",
    base: "Base",
    polygon: "Polygon",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    avalanche: "Avalanche",
    "eth-mainnet": "Ethereum",
    "base-mainnet": "Base",
    "eth-sepolia": "Ethereum Sepolia",
    "base-sepolia": "Base Sepolia",
    "arc-testnet": "Arc Testnet",
    arc: "Arc Testnet",
  };
  return map[id.toLowerCase()] ?? id.replace(/-/g, " ").replace(/_/g, " ");
}

function zerionPositionToAsset(p: ZerionPosition, isSpam: boolean): PortfolioAsset | null {
  const value = p.attributes?.value ?? 0;
  if (value <= 0 && !isSpam) return null;
  const symbol =
    p.attributes?.fungible_info?.symbol ??
    p.attributes?.symbol ??
    p.attributes?.name ??
    "Token";
  const chain = formatChainLabel(p.relationships?.chain?.data?.id ?? "unknown");
  const qty = p.attributes?.quantity?.float;
  return {
    id: p.id,
    symbol,
    name: p.attributes?.fungible_info?.name ?? p.attributes?.name ?? symbol,
    chain,
    chainId: p.relationships?.chain?.data?.id,
    valueUsd: value,
    balance: qty != null ? String(qty) : undefined,
    priceUsd: p.attributes?.price,
    change24hPct: p.attributes?.percent_change_24h ?? 0,
    isSpam,
    isNft: false,
    positionType: "wallet",
  };
}

function goldRushToAsset(t: GoldRushTokenBalance, isSpam: boolean): PortfolioAsset | null {
  const quote = t.quote ?? 0;
  if (quote <= 0 && !isSpam) return null;
  return {
    id: `gr-${t.contract_ticker_symbol}-${t.chain_name}`,
    symbol: t.contract_ticker_symbol ?? "?",
    name: t.contract_name ?? t.contract_ticker_symbol ?? "Token",
    chain: t.chain_display_name ?? formatChainLabel(t.chain_name ?? ""),
    chainId: t.chain_name,
    valueUsd: quote,
    change24hPct: 0,
    isSpam,
    isNft: false,
    positionType: "wallet",
  };
}

function zerionTxToActivity(tx: ZerionTransaction): PortfolioActivity | null {
  const attrs = tx.attributes;
  const hash = attrs?.hash;
  if (!hash) return null;
  const chain = formatChainLabel(tx.relationships?.chain?.data?.id ?? "");
  const type = attrs?.operation_type ?? "execute";
  const transfer = attrs?.transfers?.[0];
  const symbol =
    transfer?.fungible_info?.symbol ?? transfer?.fungible_info?.name ?? "";
  const dir = transfer?.direction as "in" | "out" | undefined;
  const label =
    attrs?.application_metadata?.name ??
    `${type}${symbol ? ` · ${symbol}` : ""}`;

  return {
    id: tx.id,
    hash,
    chain,
    chainId: tx.relationships?.chain?.data?.id,
    type,
    label,
    timestamp: attrs?.mined_at ?? new Date().toISOString(),
    valueUsd: transfer?.value,
    isSpam: Boolean(attrs?.is_trash),
    appName: attrs?.application_metadata?.name,
    direction: dir,
    assetSymbol: symbol || undefined,
  };
}

function zerionNftToItem(n: ZerionNftPosition): PortfolioNft | null {
  const name = n.attributes?.name ?? "NFT";
  const floor = n.attributes?.floor_price;
  return {
    id: n.id,
    name,
    collection: n.attributes?.collection_info?.name,
    chain: formatChainLabel(n.relationships?.chain?.data?.id ?? ""),
    imageUrl: n.attributes?.preview?.url,
    floorUsd: floor,
    amount: n.attributes?.amount ?? 1,
    isSpam: Boolean(n.attributes?.flags?.is_spam),
  };
}

export async function buildPortfolioWalletFeed(
  address: string,
  testnet: boolean,
): Promise<{
  feed: PortfolioWalletFeed;
  analysis: PortfolioAnalysis | null;
}> {
  const sources: string[] = [];
  let zerionAvailable = false;
  let totalUsd = 0;
  let change24hPct = 0;
  let chainDistribution: Record<string, number> = {};
  let distributionByType: Record<string, number> | undefined;

  const assets: PortfolioAsset[] = [];
  const spamAssets: PortfolioAsset[] = [];
  const nfts: PortfolioNft[] = [];
  const activities: PortfolioActivity[] = [];
  const spamActivities: PortfolioActivity[] = [];

  const [portfolio, positionsClean, positionsSpam, txs, nftPos, goldrush] =
    await Promise.all([
      getWalletPortfolio(address, testnet).catch(() => null),
      getWalletPositions(address, testnet, "only_non_trash").catch(() => null),
      getWalletPositions(address, testnet, "only_trash").catch(() => null),
      getWalletTransactions(address, testnet, "no_filter").catch(() => null),
      getWalletNftPositions(address, testnet).catch(() => null),
      getBalancesForNetworkMode(address, testnet).catch(() => null),
    ]);

  if (portfolio?.data) {
    zerionAvailable = true;
    sources.push(testnet ? "Zerion testnet" : "Zerion");
    const attrs = portfolio.data.attributes;
    totalUsd = attrs?.total?.positions ?? 0;
    change24hPct = attrs?.changes?.percent_1d ?? 0;
    chainDistribution = attrs?.positions_distribution_by_chain ?? {};
    distributionByType = attrs?.positions_distribution_by_type;
  }

  if (positionsClean?.data) {
    zerionAvailable = true;
    for (const p of positionsClean.data) {
      const a = zerionPositionToAsset(p, false);
      if (a) assets.push(a);
    }
  }

  if (positionsSpam?.data) {
    zerionAvailable = true;
    for (const p of positionsSpam.data) {
      const a = zerionPositionToAsset(p, true);
      if (a) spamAssets.push(a);
    }
  }

  if (txs?.data) {
    zerionAvailable = true;
    sources.push("Zerion txs");
    for (const tx of txs.data) {
      const a = zerionTxToActivity(tx);
      if (!a) continue;
      if (a.isSpam) spamActivities.push(a);
      else activities.push(a);
    }
  }

  if (nftPos?.data) {
    zerionAvailable = true;
    sources.push("Zerion NFTs");
    for (const n of nftPos.data) {
      const item = zerionNftToItem(n);
      if (item && !item.isSpam) nfts.push(item);
    }
  }

  if (goldrush?.data?.items?.length) {
    sources.push(testnet ? "GoldRush testnet" : "GoldRush");
    for (const t of goldrush.data.items) {
      const isSpam = Boolean(t.is_spam);
      const a = goldRushToAsset(t, isSpam);
      if (!a) continue;
      if (isSpam) {
        if (!spamAssets.some((s) => s.id === a.id)) spamAssets.push(a);
      } else if (!assets.some((x) => x.symbol === a.symbol && x.chain === a.chain)) {
        assets.push(a);
      }
    }
    const { chainDistribution: grChains, totalUsd: grTotal } =
      aggregateGoldRushByChain(goldrush.data.items, testnet);
    if (grTotal > 0) {
      totalUsd = Math.max(totalUsd, grTotal);
      chainDistribution = mergeChainData(
        totalUsd === grTotal ? grChains : chainDistribution,
        grChains,
      );
    }
  }

  if (testnet) {
    try {
      const arc = await getArcTestnetUsdBalances(address);
      if (arc.totalUsd > 0) {
        sources.push("Arc RPC");
        const key = "arc-testnet";
        chainDistribution[key] = (chainDistribution[key] ?? 0) + arc.totalUsd;
        totalUsd += arc.totalUsd;
        if (!assets.some((a) => a.chain === "Arc Testnet" && a.symbol === "USDC")) {
          assets.unshift({
            id: "arc-usdc",
            symbol: "USDC",
            name: "USD Coin",
            chain: "Arc Testnet",
            chainId: "arc-testnet",
            valueUsd: arc.totalUsd,
            change24hPct: 0,
            isSpam: false,
            isNft: false,
          });
        }
      }
    } catch {
      /* optional */
    }
  }

  assets.sort((a, b) => b.valueUsd - a.valueUsd);
  spamAssets.sort((a, b) => b.valueUsd - a.valueUsd);
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  spamActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (totalUsd === 0 && assets.length > 0) {
    totalUsd = assets.reduce((s, a) => s + a.valueUsd, 0);
  }

  const chainBalances = Object.entries(chainDistribution)
    .filter(([, v]) => v > 0.01)
    .map(([chainId, valueUsd]) => ({
      chain: formatChainLabel(chainId),
      chainId,
      valueUsd,
      percent: totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const feed: PortfolioWalletFeed = {
    address,
    networkMode: testnet ? "testnet" : "mainnet",
    totalUsd,
    change24hPct,
    assets,
    spamAssets,
    nfts,
    activities,
    spamActivities,
    chainBalances,
    distributionByType,
    sources: [...new Set(sources)],
    dataFreshness: new Date().toISOString(),
    zerionAvailable,
  };

  const analysis =
    totalUsd > 0
      ? analyzePortfolio({
          address,
          totalUsd,
          change24hPct,
          chainDistribution,
        })
      : null;

  return { feed, analysis };
}
