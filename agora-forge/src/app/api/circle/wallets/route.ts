import { NextResponse } from "next/server";
import { listCircleWallets } from "@/lib/circle";

export async function GET() {
  try {
    const data = await listCircleWallets();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list wallets" },
      { status: 500 },
    );
  }
}
