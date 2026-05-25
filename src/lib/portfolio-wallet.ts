import { getArcTestnetUsdBalances } from "@/lib/arc-balance";
import {
  getBalancesForNetworkMode,
  goldRushRawBalance,
  goldRushTokenLogo,
  type GoldRushTokenBalance,
} from "@/lib/goldrush";
import { analyzePortfolio, canonicalChainKey } from "@/lib/portfolio-engine";
import {
  resolveTokenLogo,
  tokenIcon,
  VERIFIED_TOKEN_SYMBOLS,
} from "@/lib/token-visuals";
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

const SPAM_NAME_PATTERNS =
  /airdrop|claim\s|visit\s|\.com|http|reward|voucher|www\.|blep|degen point|super meme|based usa/i;

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

function assetKey(chainId: string, symbol: string, contract?: string): string {
  const chain = canonicalChainKey(chainId);
  if (contract) return `${chain}:${contract.toLowerCase()}`;
  return `${chain}:${symbol.toUpperCase()}`;
}

/** Only GoldRush is_spam + obvious meme names — never blanket zero-quote tokens */
function isLikelySpamToken(t: GoldRushTokenBalance): boolean {
  const sym = (t.contract_ticker_symbol ?? "").toUpperCase();
  if (VERIFIED_TOKEN_SYMBOLS.has(sym)) return false;
  if (t.is_spam) return true;
  if (SPAM_NAME_PATTERNS.test(sym) || SPAM_NAME_PATTERNS.test(t.contract_name ?? "")) {
    return true;
  }
  return false;
}

function zerionPositionToAsset(p: ZerionPosition, isSpam: boolean): PortfolioAsset | null {
  const value = p.attributes?.value ?? 0;
  const qty = p.attributes?.quantity?.float;
  const hasQty = qty != null && qty > 0;
  if (!isSpam && value < 0.001 && !hasQty) return null;

  const symbol =
    p.attributes?.fungible_info?.symbol ??
    p.attributes?.symbol ??
    p.attributes?.name ??
    "Token";
  const chainId = p.relationships?.chain?.data?.id ?? "unknown";
  const iconUrl = p.attributes?.fungible_info?.icon?.url;

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
    logoUrl: resolveTokenLogo(symbol, iconUrl),
    isSpam,
    isNft: false,
    positionType: "wallet",
  };
}

function goldRushToAsset(t: GoldRushTokenBalance): PortfolioAsset | null {
  const isSpam = isLikelySpamToken(t);
  const quote = t.quote ?? 0;
  const decimals = t.contract_decimals ?? 18;
  const bal = formatTokenBalance(goldRushRawBalance(t), decimals);
  const hasBalance = bal != null && bal !== "0";

  if (t.type === "nft" || (t.nft_data && t.nft_data.length > 0)) {
    return null;
  }

  if (!isSpam && quote < 0.001 && !hasBalance) return null;

  const symbol = t.contract_ticker_symbol ?? "?";
  const chainId = t.chain_name ?? "unknown";
  const isNative = Boolean(t.is_native_token ?? t.native_token);
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
    logoUrl: resolveTokenLogo(symbol, goldRushTokenLogo(t), isNative),
    isSpam,
    isNft: false,
    unverified: quote <= 0 && hasBalance,
    positionType: "wallet",
  };
}

function goldRushToNft(t: GoldRushTokenBalance): PortfolioNft | null {
  if (t.type !== "nft" && !t.nft_data?.length) return null;
  const img =
    t.nft_data?.[0]?.external_data?.image ??
    goldRushTokenLogo(t) ??
    t.logo_url;
  return {
    id: `gr-nft-${t.chain_name}-${t.contract_address ?? t.contract_ticker_symbol}`,
    name:
      t.nft_data?.[0]?.external_data?.name ??
      t.contract_name ??
      t.contract_ticker_symbol ??
      "NFT",
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

function mergeAsset(prev: PortfolioAsset, next: PortfolioAsset): PortfolioAsset {
  const primary = next.valueUsd >= prev.valueUsd ? next : prev;
  const secondary = primary === next ? prev : next;
  return {
    ...primary,
    valueUsd: Math.max(prev.valueUsd, next.valueUsd),
    balance: primary.balance ?? secondary.balance,
    logoUrl: primary.logoUrl ?? secondary.logoUrl,
    change24hPct:
      Math.abs(primary.change24hPct) >= Math.abs(secondary.change24hPct)
        ? primary.change24hPct
        : secondary.change24hPct,
    isSpam: primary.isSpam && secondary.isSpam,
  };
}

function setAsset(
  map: Map<string, PortfolioAsset>,
  asset: PortfolioAsset,
  contract?: string,
) {
  const k = assetKey(asset.chainId ?? asset.chain, asset.symbol, contract);
  const prev = map.get(k);
  map.set(k, prev ? mergeAsset(prev, asset) : asset);
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

function hasMeaningfulHolding(a: PortfolioAsset): boolean {
  if (a.valueUsd >= 0.001) return true;
  const bal = a.balance;
  if (!bal || bal === "0") return false;
  const n = parseFloat(bal.replace(/,/g, ""));
  return !Number.isNaN(n) && n > 0;
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

  const assetMap = new Map<string, PortfolioAsset>();
  const spamMap = new Map<string, PortfolioAsset>();
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
    change24hPct = portfolio.data.attributes?.changes?.percent_1d ?? 0;
  }

  const goldItems: GoldRushTokenBalance[] = goldrush?.data?.items ?? [];
  const goldNftItems: GoldRushTokenBalance[] = goldrush?.nfts ?? [];

  if (goldItems.length > 0 || goldNftItems.length > 0) {
    sources.push(testnet ? "GoldRush testnet" : "GoldRush multichain");

    for (const t of goldItems) {
      const a = goldRushToAsset(t);
      if (!a) continue;
      if (a.isSpam) {
        if (hasMeaningfulHolding(a)) setAsset(spamMap, a, t.contract_address);
      } else {
        setAsset(assetMap, a, t.contract_address);
      }
    }

    for (const t of goldNftItems) {
      const nft = goldRushToNft(t);
      if (nft && !nft.isSpam && !nfts.some((n) => n.id === nft.id)) {
        nfts.push(nft);
      }
    }
  }

  if (positionsClean?.data) {
    zerionAvailable = true;
    for (const p of positionsClean.data) {
      const a = zerionPositionToAsset(p, false);
      if (!a) continue;
      setAsset(assetMap, a, p.relationships?.fungible?.data?.id);
    }
  }

  if (positionsSpam?.data) {
    zerionAvailable = true;
    for (const p of positionsSpam.data) {
      const a = zerionPositionToAsset(p, true);
      if (!a || !hasMeaningfulHolding(a)) continue;
      setAsset(spamMap, a);
    }
  }

  if (txs?.data?.length) {
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
      if (item && !item.isSpam && !nfts.some((x) => x.id === item.id)) {
        nfts.push(item);
      }
    }
  }

  if (testnet) {
    try {
      const arc = await getArcTestnetUsdBalances(address);
      if (arc.totalUsd > 0) {
        sources.push("Arc RPC");
        const arcAsset: PortfolioAsset = {
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
        };
        assetMap.set(assetKey("arc-testnet", "USDC"), arcAsset);
      }
    } catch {
      /* optional */
    }
  }

  const cleanAssets = [...assetMap.values()].sort((a, b) => b.valueUsd - a.valueUsd);
  const spamAssets = [...spamMap.values()].sort((a, b) => b.valueUsd - a.valueUsd);
  const { totalUsd, chainDistribution } = rebuildTotals(cleanAssets);

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  spamActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const chainBalances = Object.entries(chainDistribution)
    .filter(([, v]) => v >= 0.5)
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
