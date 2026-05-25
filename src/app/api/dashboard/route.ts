import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshot, getEthSparkline, syntheticSparkline } from "@/lib/coingecko";
import { getKitKey, listCircleWallets } from "@/lib/circle";
import {
  aggregateGoldRushByChain,
  getMultichainBalancesIncludingTestnet,
} from "@/lib/goldrush";
import type { NetworkMode } from "@/lib/network";
import {
  getGoldRushMainnetChains,
  getGoldRushSepoliaChains,
} from "@/lib/network";
import { analyzePortfolio, mergeChainData, detectRegime } from "@/lib/portfolio-engine";
import { getWalletPortfolio, getWalletPositions } from "@/lib/zerion";

function formatChainLabel(id: string): string {
  const map: Record<string, string> = {
    ethereum: "Ethereum",
    base: "Base",
    polygon: "Polygon",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    avalanche: "Avalanche",
    bsc: "BNB Chain",
    "eth-mainnet": "Ethereum",
    "base-mainnet": "Base",
    "eth-sepolia": "Ethereum Sepolia",
    "base-sepolia": "Base Sepolia",
    "polygon-mainnet": "Polygon",
    "arbitrum-mainnet": "Arbitrum",
    "optimism-mainnet": "Optimism",
    "avalanche-mainnet": "Avalanche",
  };
  return map[id] ?? id.replace(/-/g, " ").replace(/_/g, " ");
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet =
    networkParam === "mainnet"
      ? false
      : networkParam === "testnet" ||
        process.env.NEXT_PUBLIC_NETWORK !== "mainnet";

  const sources: string[] = [];
  let totalUsd = 0;
  let change24hPct = 0;
  let chainDistribution: Record<string, number> = {};
  let topPositions: Array<{
    id: string;
    name?: string;
    value: number;
    change24h: number;
    chain?: string;
  }> = [];

  const extraTestnet = testnet ? getGoldRushSepoliaChains() : [];
  const mainnetChains = getGoldRushMainnetChains();

  const [markets, goldrush, wallets, sparkline] = await Promise.all([
    getMarketSnapshot().catch(() => null),
    getMultichainBalancesIncludingTestnet(
      address,
      extraTestnet,
      mainnetChains,
    ).catch(() => null),
    listCircleWallets().catch(() => null),
    getEthSparkline().catch(() => syntheticSparkline(0)),
  ]);

  const zerionMainnet = await Promise.all([
    getWalletPortfolio(address, false).catch(() => null),
    getWalletPositions(address, false).catch(() => null),
  ]);

  if (zerionMainnet[0]) {
    sources.push("Zerion");
    const attrs = zerionMainnet[0].data?.attributes;
    totalUsd = attrs?.total?.positions ?? 0;
    change24hPct = attrs?.changes?.percent_1d ?? 0;
    chainDistribution = attrs?.positions_distribution_by_chain ?? {};
    topPositions =
      zerionMainnet[1]?.data?.slice(0, 16).map((p) => ({
        id: p.id,
        name:
          p.attributes?.fungible_info?.symbol ??
          p.attributes?.symbol ??
          p.attributes?.name,
        value: p.attributes?.value ?? 0,
        change24h: p.attributes?.percent_change_24h ?? 0,
        chain: p.relationships?.chain?.data?.id,
      })) ?? [];
  }

  if (totalUsd === 0 && testnet) {
    try {
      const [portfolio, positions] = await Promise.all([
        getWalletPortfolio(address, true),
        getWalletPositions(address, true),
      ]);
      sources.push("Zerion testnet");
      const attrs = portfolio.data?.attributes;
      totalUsd = attrs?.total?.positions ?? totalUsd;
      change24hPct = attrs?.changes?.percent_1d ?? change24hPct;
      chainDistribution =
        attrs?.positions_distribution_by_chain ?? chainDistribution;
      if (topPositions.length === 0) {
        topPositions =
          positions.data?.slice(0, 16).map((p) => ({
            id: p.id,
            name:
              p.attributes?.fungible_info?.symbol ??
              p.attributes?.symbol ??
              p.attributes?.name,
            value: p.attributes?.value ?? 0,
            change24h: p.attributes?.percent_change_24h ?? 0,
            chain: p.relationships?.chain?.data?.id,
          })) ?? [];
      }
    } catch {
      /* optional */
    }
  }

  if (goldrush?.data?.items?.length) {
    sources.push("GoldRush multichain");
    const { chainDistribution: grChains, totalUsd: grTotal, tokens } =
      aggregateGoldRushByChain(goldrush.data.items);
    if (grTotal > totalUsd) totalUsd = grTotal;
    chainDistribution = mergeChainData(chainDistribution, grChains);
    const grPositions = [...tokens]
      .sort((a, b) => (b.quote ?? 0) - (a.quote ?? 0))
      .slice(0, 16)
      .map((t, i) => ({
        id: `gr-${i}-${t.contract_ticker_symbol}`,
        name: t.contract_ticker_symbol ?? t.contract_name,
        value: t.quote ?? 0,
        change24h: 0,
        chain: t.chain_display_name ?? t.chain_name,
      }));
    if (topPositions.length < grPositions.length) {
      topPositions = mergePositions(topPositions, grPositions);
    }
  }

  if (change24hPct === 0 && markets) {
    change24hPct = (markets.ethChange24h + markets.btcChange24h) / 2;
    if (!sources.includes("CoinGecko macro")) sources.push("CoinGecko macro");
  }

  const chainBalances = Object.entries(chainDistribution)
    .filter(([, v]) => v > 0.01)
    .map(([chain, valueUsd]) => ({
      chain: formatChainLabel(chain),
      chainId: chain,
      valueUsd,
      percent: totalUsd > 0 ? (valueUsd / totalUsd) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const health = {
    network: (networkParam as NetworkMode) ?? (testnet ? "testnet" : "mainnet"),
    kitKeyPresent: Boolean(getKitKey()),
    walletCount: wallets?.data?.wallets?.length ?? 0,
    sources: [...new Set(sources)],
    apisConfigured: {
      circle: Boolean(process.env.CIRCLE_API_KEY),
      zerion: Boolean(process.env.ZERION_API_KEY),
      goldrush: Boolean(process.env.GOLDRUSH_API_KEY),
      kit: Boolean(getKitKey()),
      coingecko: true,
    },
    chainCount: chainBalances.length,
  };

  if (totalUsd === 0) {
    return NextResponse.json({
      analysis: null,
      topPositions: [],
      chainBalances: [],
      markets,
      sparkline,
      macroRegime: markets
        ? detectRegime((markets.ethChange24h + markets.btcChange24h) / 2).regime
        : "neutral",
      health,
      hint: testnet
        ? "No balance detected yet — Fund tab (ARC-TESTNET) then refresh."
        : "Connect a funded wallet across any chain.",
      dataFreshness: new Date().toISOString(),
    });
  }

  const analysis = analyzePortfolio({
    address,
    totalUsd,
    change24hPct,
    chainDistribution,
  });

  return NextResponse.json({
    analysis,
    topPositions,
    chainBalances,
    markets,
    sparkline,
    macroRegime: markets
      ? detectRegime((markets.ethChange24h + markets.btcChange24h) / 2).regime
      : analysis.regime,
    health,
    dataFreshness: new Date().toISOString(),
  });
}

function mergePositions(
  a: Array<{ id: string; name?: string; value: number; change24h: number; chain?: string }>,
  b: Array<{ id: string; name?: string; value: number; change24h: number; chain?: string }>,
) {
  const byKey = new Map<string, (typeof a)[0]>();
  for (const p of [...a, ...b]) {
    const key = `${p.name}-${p.chain}`;
    const existing = byKey.get(key);
    if (!existing || p.value > existing.value) byKey.set(key, p);
  }
  return [...byKey.values()].sort((x, y) => y.value - x.value).slice(0, 16);
}
