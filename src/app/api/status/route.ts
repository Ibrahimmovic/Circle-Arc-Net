import { NextResponse } from "next/server";
import { listCircleWallets } from "@/lib/circle";
import { getWalletPortfolio } from "@/lib/zerion";
import { getAllChainsBalances } from "@/lib/goldrush";

export async function GET() {
  const demo =
    process.env.NEXT_PUBLIC_DEMO_WALLET ??
    "0x3D652FA69567eeC176c74027B256022B2bb05586";

  const status = {
    circle: false,
    kit: Boolean(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY),
    zerion: false,
    goldrush: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await listCircleWallets();
    status.circle = true;
  } catch {
    /* */
  }

  try {
    await getWalletPortfolio(demo, false);
    status.zerion = true;
  } catch {
    /* */
  }

  try {
    await getAllChainsBalances(demo);
    status.goldrush = true;
  } catch {
    /* */
  }

  const allOk = status.circle && status.kit && status.zerion && status.goldrush;

  return NextResponse.json({ ok: allOk, services: status });
}
