import { NextResponse } from "next/server";
import { listCircleWallets } from "@/lib/circle";
import { getWalletBalanceChart, getWalletPortfolio } from "@/lib/zerion";
import { getAllChainsBalances } from "@/lib/goldrush";
import { getWalletTokensForChain, isMoralisConfigured } from "@/lib/moralis";

export async function GET() {
  const demo =
    process.env.NEXT_PUBLIC_DEMO_WALLET ??
    "0x3D652FA69567eeC176c74027B256022B2bb05586";

  const status = {
    circle: false,
    kit: Boolean(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY),
    zerion: false,
    zerionChart: false,
    goldrush: false,
    moralis: false,
    network: process.env.NEXT_PUBLIC_NETWORK ?? "mainnet",
    zerionKeySet: Boolean(process.env.ZERION_API_KEY?.trim()),
    goldrushKeySet: Boolean(process.env.GOLDRUSH_API_KEY?.trim()),
    moralisKeySet: Boolean(process.env.MORALIS_API_KEY?.trim()),
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

  try {
    await getAllChainsBalances(demo);
    status.goldrush = true;
  } catch (e) {
    errors.goldrush = e instanceof Error ? e.message.slice(0, 80) : "failed";
  }

  if (isMoralisConfigured()) {
    try {
      const tokens = await getWalletTokensForChain(demo, "base");
      status.moralis = tokens.length >= 0;
    } catch (e) {
      errors.moralis = e instanceof Error ? e.message.slice(0, 120) : "failed";
    }
  }

  const allOk = status.circle && status.kit && status.zerion && status.goldrush;

  return NextResponse.json({ ok: allOk, services: status, errors });
}
