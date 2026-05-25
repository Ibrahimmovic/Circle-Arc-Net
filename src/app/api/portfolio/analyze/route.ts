import { NextRequest, NextResponse } from "next/server";
import { aggregateGoldRushByChain, getAllChainsBalances } from "@/lib/goldrush";
import { analyzePortfolio, mergeChainData } from "@/lib/portfolio-engine";
import { getWalletPortfolio, getWalletPositions } from "@/lib/zerion";

export async function GET(req: NextRequest) {
  const address =
    req.nextUrl.searchParams.get("address") ??
    process.env.NEXT_PUBLIC_DEMO_WALLET;

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const goldrush = await getAllChainsBalances(address).catch(() => null);

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

    try {
      const [portfolio, positions] = await Promise.all([
        getWalletPortfolio(address),
        getWalletPositions(address),
      ]);

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
    } catch (zerionErr) {
      console.warn("Zerion unavailable, using GoldRush fallback", zerionErr);
    }

    if (goldrush?.data?.items?.length) {
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

    if (totalUsd === 0) {
      return NextResponse.json(
        { error: "No portfolio data from Zerion or GoldRush" },
        { status: 502 },
      );
    }

    const analysis = analyzePortfolio({
      address,
      totalUsd,
      change24hPct,
      chainDistribution,
    });

    return NextResponse.json({ analysis, topPositions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
