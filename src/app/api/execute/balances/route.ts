import { NextRequest, NextResponse } from "next/server";
import { fetchWalletBalances } from "@/lib/wallet-balances";
import { resolveApiTestnet, type NetworkMode } from "@/lib/network";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const chains = req.nextUrl.searchParams.get("chains");
  const mode: NetworkMode = resolveApiTestnet(req.nextUrl.searchParams.get("network"))
    ? "testnet"
    : "mainnet";

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const list = chains
    ? chains.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  if (list.length === 0) {
    return NextResponse.json({ error: "Missing chains" }, { status: 400 });
  }

  try {
    const balances = await fetchWalletBalances(address, list, mode);
    return NextResponse.json({ balances });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Balance fetch failed" },
      { status: 502 },
    );
  }
}
