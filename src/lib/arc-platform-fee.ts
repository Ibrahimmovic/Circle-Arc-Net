import { encodeFunctionData, erc20Abi } from "viem";
import { ARC_TESTNET_USDC, getArcTestnetUsdBalances } from "@/lib/arc-balance";
import { arcTestnet } from "@/lib/chains";
import {
  chainIdToHex,
  isUserRejected,
  switchWalletToChain,
  waitForWalletChain,
  withTimeout,
} from "@/lib/wallet-chain";

/** Platform fee: 0.01 USDC (6 decimals) on Arc Testnet. */
export const ARC_PLATFORM_FEE_UNITS = BigInt(10000);
export const ARC_PLATFORM_FEE_LABEL = "0.01 USDC";
export const ARC_CHAIN_ID = arcTestnet.id;

/**
 * Debit platform fee on Arc Testnet only (chainId 5042002).
 * Wallet must show Arc Testnet + USDC transfer — not Base Sepolia.
 */
export async function debitArcPlatformFee(
  userAddress: string,
): Promise<{ ok: boolean; skipped?: boolean; message: string; txHash?: string }> {
  if (!window.ethereum) {
    return { ok: false, message: "Wallet not available" };
  }

  const provider = window.ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };

  try {
    const { totalUsd } = await getArcTestnetUsdBalances(userAddress);
    if (totalUsd < 0.01) {
      return {
        ok: false,
        message:
          "Need at least 0.01 USDC on Arc Testnet for the platform fee — Fund → ARC-TESTNET",
      };
    }

    await switchWalletToChain(ARC_CHAIN_ID);
    await waitForWalletChain(ARC_CHAIN_ID);

    const treasury = (process.env.NEXT_PUBLIC_ARC_FEE_WALLET ??
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e") as `0x${string}`;

    const feeData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [treasury, ARC_PLATFORM_FEE_UNITS],
    });

    const txHash = (await withTimeout(
      provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            chainId: chainIdToHex(ARC_CHAIN_ID),
            from: userAddress,
            to: ARC_TESTNET_USDC,
            data: feeData,
            value: "0x0",
          },
        ],
      }),
      120_000,
      "Arc fee transaction",
    )) as string;

    return {
      ok: true,
      txHash,
      message: `Fee ${ARC_PLATFORM_FEE_LABEL} paid on Arc Testnet`,
    };
  } catch (e) {
    if (isUserRejected(e)) {
      return { ok: false, message: "Arc fee cancelled in wallet" };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("insufficient")) {
      return {
        ok: false,
        skipped: true,
        message: "Not enough USDC on Arc Testnet — Fund → ARC-TESTNET",
      };
    }
    return { ok: false, message: msg };
  }
}
