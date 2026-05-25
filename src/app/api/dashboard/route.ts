import { NextRequest, NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/coingecko";
import { getKitKey, listCircleWallets } from "@/lib/circle";
import { aggregateGoldRushByChain, getAllChainsBalances } from "@/lib/goldrush";
import { getNetworkMode, getGoldRushChainList } from "@/lib/network";
import { analyzePortfolio, mergeChainData, detectRegime } from "@/lib/portfolio-engine";
import { getWalletPortfolio, getWalletPositions } from "@/lib/zerion";

export async function GET(req: NextRequest) {
  const address =
    req.nextUrl.searchParams.get("address") ??
    process.env.NEXT_PUBLIC_DEMO_WALLET;

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const testnet = getNetworkMode() === "testnet";
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

  const [markets, goldrush, wallets] = await Promise.all([
    getMarketSnapshot().catch(() => null),
    getAllChainsBalances(address, getGoldRushChainList()).catch(() => null),
    listCircleWallets().catch(() => null),
  ]);

  try {
    const [portfolio, positions] = await Promise.all([
      getWalletPortfolio(address, testnet),
      getWalletPositions(address, testnet),
    ]);
    sources.push("Zerion");
    const attrs = portfolio.data?.attributes;
    totalUsd = attrs?.total?.positions ?? 0;
    change24hPct = attrs?.changes?.percent_1d ?? 0;
    chainDistribution = attrs?.positions_distribution_by_chain ?? {};
    topPositions =
      positions.data?.slice(0, 12).map((p) => ({
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

  if (goldrush?.data?.items?.length) {
    sources.push("GoldRush");
    const { chainDistribution: grChains, totalUsd: grTotal, tokens } =
      aggregateGoldRushByChain(goldrush.data.items);
    if (totalUsd === 0) totalUsd = grTotal;
    chainDistribution = mergeChainData(chainDistribution, grChains);
    if (topPositions.length === 0) {
      topPositions = [...tokens]
        .sort((a, b) => (b.quote ?? 0) - (a.quote ?? 0))
        .slice(0, 12)
        .map((t, i) => ({
          id: `gr-${i}`,
          name: t.contract_ticker_symbol ?? t.contract_name,
          value: t.quote ?? 0,
          change24h: 0,
          chain: t.chain_name,
        }));
    }
  }

  if (change24hPct === 0 && markets) {
    change24hPct = (markets.ethChange24h + markets.btcChange24h) / 2;
    sources.push("CoinGecko macro");
  }

  if (totalUsd === 0) {
    return NextResponse.json({
      analysis: null,
      topPositions: [],
      markets,
      health: {
        network: getNetworkMode(),
        kitKeyPresent: Boolean(getKitKey()),
        walletCount: wallets?.data?.wallets?.length ?? 0,
        sources,
        apisConfigured: {
          circle: Boolean(process.env.CIRCLE_API_KEY),
          zerion: Boolean(process.env.ZERION_API_KEY),
          goldrush: Boolean(process.env.GOLDRUSH_API_KEY),
          kit: Boolean(getKitKey()),
        },
      },
      hint: testnet
        ? "Fund wallet via Fund tab (Circle faucet) then refresh."
        : "Connect a funded wallet or check API keys on Vercel.",
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
    markets,
    macroRegime: markets
      ? detectRegime((markets.ethChange24h + markets.btcChange24h) / 2).regime
      : analysis.regime,
    health: {
      network: getNetworkMode(),
      kitKeyPresent: Boolean(getKitKey()),
      walletCount: wallets?.data?.wallets?.length ?? 0,
      sources,
      apisConfigured: {
        circle: Boolean(process.env.CIRCLE_API_KEY),
        zerion: Boolean(process.env.ZERION_API_KEY),
        goldrush: Boolean(process.env.GOLDRUSH_API_KEY),
        kit: Boolean(getKitKey()),
      },
    },
  });
}
