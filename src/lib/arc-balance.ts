import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { arcTestnet } from "@/lib/chains";

/** Arc docs: optional ERC-20 interface for native USDC (6 decimals). */
export const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000" as const;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

/** On-chain Arc Testnet USDC (and native gas balance) for portfolio when indexers miss Arc. */
export async function getArcTestnetUsdBalances(address: string): Promise<{
  usdcErc20: number;
  nativeUsdc: number;
  totalUsd: number;
}> {
  const addr = address as `0x${string}`;
  const [erc20Bal, nativeBal] = await Promise.all([
    client
      .readContract({
        address: ARC_TESTNET_USDC,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [addr],
      })
      .catch(() => BigInt(0)),
    client.getBalance({ address: addr }).catch(() => BigInt(0)),
  ]);

  const usdcErc20 = Number(formatUnits(erc20Bal, 6));
  const nativeUsdc = Number(formatUnits(nativeBal, 18));
  /** Native gas token and ERC-20 interface share one balance — do not sum both. */
  const totalUsd = Math.max(usdcErc20, nativeUsdc);

  return { usdcErc20, nativeUsdc, totalUsd };
}
