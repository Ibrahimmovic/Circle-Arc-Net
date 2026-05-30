import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshot, getEthSparkline, syntheticSparkline } from "@/lib/coingecko";
import { getKitKey, listCircleWallets } from "@/lib/circle";
import {
  aggregateGoldRushByChain,
  getBalancesForNetworkMode,
} from "@/lib/goldrush";
import { resolveApiTestnet, type NetworkMode } from "@/lib/network";
import { analyzePortfolio, mergeChainData, detectRegime } from "@/lib/portfolio-engine";
import { getWalletPortfolio, getWalletPositions } from "@/lib/zerion";
import { getArcTestnetUsdBalances } from "@/lib/arc-balance";

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
    arc: "Arc Testnet",
    "arc-testnet": "Arc Testnet",
  };
  return map[id] ?? id.replace(/-/g, " ").replace(/_/g, " ");
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const networkParam = req.nextUrl.searchParams.get("network");
  const testnet = resolveApiTestnet(networkParam);

  const networkMode: NetworkMode = testnet ? "testnet" : "mainnet";
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

  const [markets, goldrush, wallets, sparkline] = await Promise.all([
    getMarketSnapshot().catch(() => null),
    getBalancesForNetworkMode(address, testnet).catch(() => null),
    listCircleWallets().catch(() => null),
    getEthSparkline().catch(() => syntheticSparkline(0)),
  ]);

  try {
    const [portfolio, positions] = await Promise.all([
      getWalletPortfolio(address, testnet),
      getWalletPositions(address, testnet),
    ]);
    sources.push(testnet ? "Zerion testnet" : "Zerion");
    const attrs = portfolio.data?.attributes;
    totalUsd = attrs?.total?.positions ?? 0;
    change24hPct = attrs?.changes?.percent_1d ?? 0;
    chainDistribution = attrs?.positions_distribution_by_chain ?? {};
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
  } catch {
    /* Zerion optional */
  }

  if (testnet) {
    try {
      const arc = await getArcTestnetUsdBalances(address);
      if (arc.totalUsd > 0) {
        sources.push("Arc RPC");
        const key = "arc-testnet";
        chainDistribution[key] = (chainDistribution[key] ?? 0) + arc.totalUsd;
        totalUsd += arc.totalUsd;
        if (!topPositions.some((p) => p.name === "USDC")) {
          topPositions.unshift({
            id: "arc-usdc",
            name: "USDC",
            value: arc.totalUsd,
            change24h: 0,
            chain: "Arc Testnet",
          });
        }
      }
    } catch {
      /* Arc RPC optional */
    }
  }

  if (goldrush?.data?.items?.length) {
    sources.push(testnet ? "GoldRush testnet" : "GoldRush");
    const { chainDistribution: grChains, totalUsd: grTotal, tokens } =
      aggregateGoldRushByChain(goldrush.data.items, testnet);
    if (grTotal > 0) {
      totalUsd = Math.max(totalUsd, grTotal);
      chainDistribution = mergeChainData(
        totalUsd === grTotal ? grChains : chainDistribution,
        grChains,
      );
    }
    if (topPositions.length === 0 && tokens.length > 0) {
      topPositions = [...tokens]
        .sort((a, b) => (b.quote ?? 0) - (a.quote ?? 0))
        .slice(0, 16)
        .map((t, i) => ({
          id: `gr-${i}`,
          name: t.contract_ticker_symbol ?? t.contract_name,
          value: t.quote ?? 0,
          change24h: 0,
          chain: t.chain_display_name ?? t.chain_name,
        }));
    }
  }

  if (change24hPct === 0 && markets) {
    change24hPct = (markets.ethChange24h + markets.btcChange24h) / 2;
    sources.push("CoinGecko");
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
    network: networkMode,
    kitKeyPresent: Boolean(getKitKey()),
    walletCount: wallets?.data?.wallets?.length ?? 0,
    sources: [...new Set(sources)],
    apisConfigured: {
      circle: Boolean(process.env.CIRCLE_API_KEY),
      zerion: Boolean(process.env.ZERION_API_KEY),
      alchemy: Boolean(process.env.ALCHEMY_API_KEY),
      goplus: Boolean(
        process.env.GOPLUS_API_KEY?.trim() && process.env.GOPLUS_API_SECRET?.trim(),
      ),
      dune: Boolean(process.env.DUNE_API_KEY),
      covalent: Boolean(process.env.GOLDRUSH_API_KEY),
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
      networkMode,
      macroRegime: markets
        ? detectRegime((markets.ethChange24h + markets.btcChange24h) / 2).regime
        : "neutral",
      health,
      hint: testnet
        ? "No testnet balance found — Execute → Fund → ARC-TESTNET, wait 30s, refresh."
        : "No mainnet balance on this wallet for the selected network.",
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
    networkMode,
    macroRegime: markets
      ? detectRegime((markets.ethChange24h + markets.btcChange24h) / 2).regime
      : analysis.regime,
    health,
    dataFreshness: new Date().toISOString(),
  });
}
