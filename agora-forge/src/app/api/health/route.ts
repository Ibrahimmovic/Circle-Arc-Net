import { NextResponse } from "next/server";
import { getKitKey, listCircleWallets } from "@/lib/circle";
import type { CircleHealth } from "@/lib/types";

export async function GET() {
  try {
    const wallets = await listCircleWallets();
    const count = wallets.data?.wallets?.length ?? 0;
    const health: CircleHealth = {
      walletsConfigured: count > 0,
      walletCount: count,
      kitKeyPresent: Boolean(getKitKey()),
      products: [
        "Circle Wallets (TEST_API_KEY)",
        "App Kit — Bridge / Swap / CCTP",
        "Zerion Portfolio",
        "GoldRush Multichain Balances",
      ],
    };
    return NextResponse.json(health);
  } catch (e) {
    return NextResponse.json(
      {
        walletsConfigured: false,
        walletCount: 0,
        kitKeyPresent: Boolean(getKitKey()),
        products: [],
        error: e instanceof Error ? e.message : "Health check failed",
      },
      { status: 200 },
    );
  }
}
