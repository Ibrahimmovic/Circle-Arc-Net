import { getArcTestnetUsdBalances } from "@/lib/arc-balance";
import {
  getBalancesForNetworkMode,
  getMainnetBalancesFull,
  type GoldRushTokenBalance,
} from "@/lib/goldrush";
import {
  analyzePortfolio,
  canonicalChainKey,
  mergeChainData,
} from "@/lib/portfolio-engine";
import { tokenIcon } from "@/lib/token-visuals";
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

const CHAIN_DISPLAY: Record<string, string> = {
  base: "Base",
  ethereum: "Ethereum",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  avalanche: "Avalanche",
  arc: "Arc Testnet",
};

function chainLabel(chainId: string): string {
  const key = canonicalChainKey(chainId);
  return CHAIN_DISPLAY[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function formatTokenBalance(raw: string | undefined, decimals: number): string | undefined {
  if (!raw || raw === "0") return "0";
  try {
    const v = BigInt(raw);
    if (v === BigInt(0)) return "0";
    const n = Number(v) / 10 ** Math.min(decimals, 18);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
    if (n >= 0.0001) return n.toFixed(6);
    return "<0.0001";
  } catch {
    return undefined;
  }
}

function isLikelySpamToken(t: GoldRushTokenBalance): boolean {
  if (t.is_spam) return true;
  const sym = (t.contract_ticker_symbol ?? "").toLowerCase();
  const quote = t.quote ?? 0;
  if (quote > 1) return false;
  const spamPatterns = /airdrop|claim|visit|\.com|http|reward|voucher|www\./i;
  if (spamPatterns.test(sym) || spamPatterns.test(t.contract_name ?? "")) return true;
  if (quote === 0 && t.balance && t.balance !== "0") {
    const dec = t.contract_decimals ?? 18;
    try {
      const n = Number(BigInt(t.balance)) / 10 ** dec;
      if (n > 1000 && quote === 0) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function zerionPositionToAsset(p: ZerionPosition, isSpam: boolean): PortfolioAsset | null {
  const value = p.attributes?.value ?? 0;
  const qty = p.attributes?.quantity?.float;
  const hasQty = qty != null && qty > 0;
  if (value <= 0 && !hasQty && !isSpam) return null;

  const symbol =
    p.attributes?.fungible_info?.symbol ??
    p.attributes?.symbol ??
    p.attributes?.name ??
    "Token";
  const chainId = p.relationships?.chain?.data?.id ?? "unknown";

  return {
    id: p.id,
    symbol,
    name: p.attributes?.fungible_info?.name ?? p.attributes?.name ?? symbol,
    chain: chainLabel(chainId),
    chainId,
    valueUsd: value,
    balance: hasQty ? String(qty) : undefined,
    priceUsd: p.attributes?.price,
    change24hPct: p.attributes?.percent_change_24h ?? 0,
    logoUrl: tokenIcon(symbol),
    isSpam,
    isNft: false,
    positionType: "wallet",
  };
}

function goldRushToAsset(t: GoldRushTokenBalance): PortfolioAsset | null {
  const isSpam = isLikelySpamToken(t);
  const quote = t.quote ?? 0;
  const decimals = t.contract_decimals ?? 18;
  const bal = formatTokenBalance(t.balance, decimals);
  const hasBalance = bal != null && bal !== "0";

  if (t.type === "nft" || (t.nft_data && t.nft_data.length > 0)) {
    return null;
  }

  if (!isSpam && quote <= 0 && !hasBalance) return null;

  const symbol = t.contract_ticker_symbol ?? "?";
  const chainId = t.chain_name ?? "unknown";
  const change24h =
    t.quote_24h && quote > 0
      ? ((quote - t.quote_24h) / t.quote_24h) * 100
      : 0;

  return {
    id: `gr-${chainId}-${t.contract_address ?? symbol}`,
    symbol,
    name: t.contract_name ?? symbol,
    chain: t.chain_display_name ?? chainLabel(chainId),
    chainId,
    valueUsd: Math.max(quote, 0),
    balance: bal,
    change24hPct: change24h,
    logoUrl: t.logo_url ?? tokenIcon(symbol),
    isSpam,
    isNft: false,
    unverified: quote <= 0 && hasBalance,
    positionType: "wallet",
  };
}

function goldRushToNft(t: GoldRushTokenBalance): PortfolioNft | null {
  if (t.type !== "nft" && !t.nft_data?.length) return null;
  const img = t.nft_data?.[0]?.external_data?.image ?? t.logo_url;
  return {
    id: `gr-nft-${t.contract_address ?? t.contract_ticker_symbol}`,
    name: t.contract_name ?? t.contract_ticker_symbol ?? "NFT",
    collection: t.contract_name,
    chain: chainLabel(t.chain_name ?? ""),
    imageUrl: img,
    floorUsd: t.quote,
    amount: 1,
    isSpam: Boolean(t.is_spam),
  };
}

function zerionTxToActivity(tx: ZerionTransaction): PortfolioActivity | null {
  const attrs = tx.attributes;
  const hash = attrs?.hash;
  if (!hash) return null;
  const chainId = tx.relationships?.chain?.data?.id ?? "";
  const type = attrs?.operation_type ?? "execute";
  const transfer = attrs?.transfers?.[0];
  const symbol =
    transfer?.fungible_info?.symbol ?? transfer?.fungible_info?.name ?? "";
  const label =
    attrs?.application_metadata?.name ??
    `${type}${symbol ? ` · ${symbol}` : ""}`;

  return {
    id: tx.id,
    hash,
    chain: chainLabel(chainId),
    chainId,
    type,
    label,
    timestamp: attrs?.mined_at ?? new Date().toISOString(),
    valueUsd: transfer?.value,
    isSpam: Boolean(attrs?.is_trash),
    appName: attrs?.application_metadata?.name,
    direction: transfer?.direction as "in" | "out" | undefined,
    assetSymbol: symbol || undefined,
  };
}

function zerionNftToItem(n: ZerionNftPosition): PortfolioNft | null {
  const name = n.attributes?.name ?? "NFT";
  return {
    id: n.id,
    name,
    collection: n.attributes?.collection_info?.name,
    chain: chainLabel(n.relationships?.chain?.data?.id ?? ""),
    imageUrl: n.attributes?.preview?.url,
    floorUsd: n.attributes?.floor_price,
    amount: n.attributes?.amount ?? 1,
    isSpam: Boolean(n.attributes?.flags?.is_spam),
  };
}

function rebuildTotals(assets: PortfolioAsset[]): {
  totalUsd: number;
  chainDistribution: Record<string, number>;
} {
  let totalUsd = 0;
  const chainDistribution: Record<string, number> = {};

  for (const a of assets) {
    if (a.isSpam) continue;
    totalUsd += a.valueUsd;
    const key = canonicalChainKey(a.chainId ?? a.chain);
    chainDistribution[key] = (chainDistribution[key] ?? 0) + a.valueUsd;
  }

  return { totalUsd, chainDistribution };
}

function dedupeAssets(list: PortfolioAsset[]): PortfolioAsset[] {
  const byKey = new Map<string, PortfolioAsset>();
  for (const a of list) {
    const key = `${canonicalChainKey(a.chainId ?? a.chain)}:${a.symbol.toUpperCase()}`;
    const prev = byKey.get(key);
    if (!prev || a.valueUsd > prev.valueUsd) byKey.set(key, a);
  }
  return [...byKey.values()];
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
  let change24hPct = 0;

  const assets: PortfolioAsset[] = [];
  const spamAssets: PortfolioAsset[] = [];
  const nfts: PortfolioNft[] = [];
  const activities: PortfolioActivity[] = [];
  const spamActivities: PortfolioActivity[] = [];

  const [portfolio, positionsClean, positionsSpam, txs, nftPos, goldrush, mainnetExtra] =
    await Promise.all([
      getWalletPortfolio(address, testnet).catch(() => null),
      getWalletPositions(address, testnet, "only_non_trash").catch(() => null),
      getWalletPositions(address, testnet, "only_trash").catch(() => null),
      getWalletTransactions(address, testnet, "no_filter").catch(() => null),
      getWalletNftPositions(address, testnet).catch(() => null),
      getBalancesForNetworkMode(address, testnet).catch(() => null),
      !testnet ? getMainnetBalancesFull(address).catch(() => null) : Promise.resolve(null),
    ]);

  if (portfolio?.data) {
    zerionAvailable = true;
    sources.push(testnet ? "Zerion testnet" : "Zerion");
    change24hPct = portfolio.data.attributes?.changes?.percent_1d ?? 0;
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

  if (nftPos?.data?.length) {
    zerionAvailable = true;
    sources.push("Zerion NFTs");
    for (const n of nftPos.data) {
      const item = zerionNftToItem(n);
      if (item && !item.isSpam) nfts.push(item);
    }
  }

  const goldItems: GoldRushTokenBalance[] = [
    ...(goldrush?.data?.items ?? []),
    ...(mainnetExtra?.clean ?? []),
    ...(mainnetExtra?.spam ?? []),
  ];

  if (goldItems.length > 0) {
    sources.push(testnet ? "GoldRush testnet" : "GoldRush Base+ETH+…");
    const seenSpam = new Set<string>();

    for (const t of goldItems) {
      const nft = goldRushToNft(t);
      if (nft && !nft.isSpam && !nfts.some((n) => n.id === nft.id)) {
        nfts.push(nft);
      }

      const a = goldRushToAsset(t);
      if (!a) continue;

      if (a.isSpam) {
        if (!seenSpam.has(a.id)) {
          seenSpam.add(a.id);
          spamAssets.push(a);
        }
      } else {
        assets.push(a);
      }
    }
  }

  if (testnet) {
    try {
      const arc = await getArcTestnetUsdBalances(address);
      if (arc.totalUsd > 0) {
        sources.push("Arc RPC");
        assets.unshift({
          id: "arc-usdc",
          symbol: "USDC",
          name: "USD Coin",
          chain: "Arc Testnet",
          chainId: "arc-testnet",
          valueUsd: arc.totalUsd,
          balance: String(arc.totalUsd),
          change24hPct: 0,
          logoUrl: tokenIcon("USDC"),
          isSpam: false,
          isNft: false,
        });
      }
    } catch {
      /* optional */
    }
  }

  const cleanAssets = dedupeAssets(assets);
  const { totalUsd, chainDistribution } = rebuildTotals(cleanAssets);

  cleanAssets.sort((a, b) => b.valueUsd - a.valueUsd);
  spamAssets.sort((a, b) => b.valueUsd - a.valueUsd);
  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  spamActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const chainBalances = Object.entries(chainDistribution)
    .filter(([, v]) => v > 0.001)
    .map(([chainId, valueUsd]) => ({
      chain: chainLabel(chainId),
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
    assets: cleanAssets,
    spamAssets,
    nfts,
    activities,
    spamActivities,
    chainBalances,
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
