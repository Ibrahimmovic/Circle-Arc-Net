import { NextRequest, NextResponse } from "next/server";
import { findExecToken, getExecChain } from "@/lib/execution/chain-catalog";
import { resolveApiTestnet } from "@/lib/network";
import { createPublicClient, erc20Abi, formatUnits, http, type Address } from "viem";
import { arcTestnet, APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";
import { getArcTestnetUsdBalances, ARC_TESTNET_USDC } from "@/lib/arc-balance";
import { LIFI_TESTNET_TOKENS } from "@/lib/lifi-tokens";
import { baseSepolia, sepolia } from "viem/chains";

const RPC: Record<number, string> = {
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://sepolia.base.org",
  11155111: "https://rpc.sepolia.org",
};

async function usdcOnChain(
  chainId: number,
  user: Address,
  tokenAddress: string,
  decimals: number,
): Promise<number> {
  if (chainId === 5042002) {
    const arc = await getArcTestnetUsdBalances(user);
    return arc.totalUsd;
  }
  const rpc = RPC[chainId];
  if (!rpc) return 0;
  const chain =
    chainId === 84532 ? baseSepolia : chainId === 11155111 ? sepolia : arcTestnet;
  const client = createPublicClient({ chain, transport: http(rpc) });
  const raw = await client
    .readContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [user],
    })
    .catch(() => BigInt(0));
  return Number(formatUnits(raw, decimals));
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const chain = req.nextUrl.searchParams.get("chain");
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "USDC";

  if (!address || !chain) {
    return NextResponse.json({ error: "address and chain required" }, { status: 400 });
  }

  const testnet = resolveApiTestnet(req.nextUrl.searchParams.get("network"));
  const mode = testnet ? "testnet" : "mainnet";
  const cfg = getExecChain(chain, mode);
  const meta = findExecToken(chain, symbol, mode);
  if (!cfg || !meta) {
    return NextResponse.json({ error: "unsupported" }, { status: 400 });
  }

  const chainId = APP_KIT_TO_WAGMI_CHAIN_ID[chain];
  if (chainId == null) {
    return NextResponse.json({ error: "unsupported chain" }, { status: 400 });
  }

  const addr = address as Address;
  let tokenAddr = meta.address;
  if (!tokenAddr.startsWith("0x") && chainId === 84532 && symbol === "USDC") {
    tokenAddr = LIFI_TESTNET_TOKENS[84532]?.USDC?.address ?? tokenAddr;
  }
  if (!tokenAddr.startsWith("0x") && chainId === 11155111 && symbol === "USDC") {
    tokenAddr = LIFI_TESTNET_TOKENS[11155111]?.USDC?.address ?? tokenAddr;
  }

  const balance =
    chainId === 5042002 && symbol === "USDC"
      ? (await getArcTestnetUsdBalances(addr)).totalUsd
      : tokenAddr.startsWith("0x")
        ? await usdcOnChain(chainId, addr, tokenAddr, meta.decimals)
        : 0;

  return NextResponse.json({
    chain,
    symbol,
    balance: balance.toFixed(6).replace(/\.?0+$/, "") || "0",
    chainId,
  });
}
