import { NextResponse } from "next/server";
import { getWalletTransactionsAlchemy, isAlchemyConfigured } from "@/lib/alchemy";
import { listCircleWallets } from "@/lib/circle";
import { isGoPlusConfigured } from "@/lib/goplus";
import { getAllChainsBalances } from "@/lib/goldrush";
import { readPortfolioProviderStatus } from "@/lib/portfolio-providers";
import { getWalletBalanceChart, getWalletPortfolio } from "@/lib/zerion";

export async function GET() {
  const demo =
    process.env.NEXT_PUBLIC_DEMO_WALLET ??
    "0x3D652FA69567eeC176c74027B256022B2bb05586";

  const providers = readPortfolioProviderStatus();

  const status = {
    circle: false,
    kit: Boolean(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY),
    zerion: false,
    zerionChart: false,
    alchemy: false,
    goplus: providers.goplus,
    dune: providers.dune,
    covalent: false,
    network: process.env.NEXT_PUBLIC_NETWORK ?? "mainnet",
    providers,
    timestamp: new Date().toISOString(),
  };
  const errors: Record<string, string> = {};

  try {
    await listCircleWallets();
    status.circle = true;
  } catch (e) {
    errors.circle = e instanceof Error ? e.message.slice(0, 80) : "failed";
  }

  try {
    await getWalletPortfolio(demo, false);
    status.zerion = true;
  } catch (e) {
    errors.zerion = e instanceof Error ? e.message.slice(0, 120) : "failed";
  }

  try {
    const chart = await getWalletBalanceChart(demo, "week", false);
    status.zerionChart = Boolean(chart.data?.attributes?.points?.length);
  } catch (e) {
    errors.zerionChart = e instanceof Error ? e.message.slice(0, 120) : "failed";
  }

  if (isAlchemyConfigured()) {
    try {
      const txs = await getWalletTransactionsAlchemy(demo, false);
      status.alchemy = txs.length >= 0;
    } catch (e) {
      errors.alchemy = e instanceof Error ? e.message.slice(0, 120) : "failed";
    }
  }

  try {
    await getAllChainsBalances(demo);
    status.covalent = true;
  } catch (e) {
    errors.covalent = e instanceof Error ? e.message.slice(0, 80) : "failed";
  }

  if (isGoPlusConfigured() && !providers.goplus) {
    errors.goplus = "GOPLUS keys incomplete";
  }

  const portfolioOk =
    (status.zerion || status.alchemy) && (status.covalent || providers.zerion);

  return NextResponse.json({
    ok: status.circle && status.kit && portfolioOk,
    services: status,
    errors,
  });
}
