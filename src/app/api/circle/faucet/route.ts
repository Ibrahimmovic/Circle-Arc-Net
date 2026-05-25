import { NextRequest, NextResponse } from "next/server";
import {
  requestCircleFaucet,
  type CircleFaucetBlockchain,
} from "@/lib/circle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, blockchain } = body as {
      address?: string;
      blockchain?: CircleFaucetBlockchain;
    };

    if (!address || !blockchain) {
      return NextResponse.json(
        { error: "address and blockchain required" },
        { status: 400 },
      );
    }

    const result = await requestCircleFaucet({
      address,
      blockchain,
      usdc: true,
      native: true,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "Faucet request failed",
      },
      { status: 500 },
    );
  }
}
