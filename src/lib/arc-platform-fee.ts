import { encodeFunctionData, erc20Abi } from "viem";
import { ARC_TESTNET_USDC } from "@/lib/arc-balance";
import { arcTestnet } from "@/lib/chains";

/** Platform fee: 0.01 USDC (6 decimals) on Arc Testnet. */
export const ARC_PLATFORM_FEE_UNITS = BigInt(10000);
export const ARC_PLATFORM_FEE_LABEL = "0.01 USDC";

const ARC_CHAIN_HEX = `0x${arcTestnet.id.toString(16)}`;

export async function ensureArcTestnetChain(
  provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_HEX }],
    });
  } catch (e) {
    const err = e as { code?: number };
    if (err.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC_CHAIN_HEX,
            chainName: arcTestnet.name,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          },
        ],
      });
    } else {
      throw e;
    }
  }
}

/**
 * Debit platform fee on Arc in USDC. Returns false if skipped (low balance).
 */
export async function debitArcPlatformFee(
  userAddress: string,
): Promise<{ ok: boolean; skipped?: boolean; message: string }> {
  if (!window.ethereum) {
    return { ok: false, message: "Wallet not available" };
  }

  const provider = window.ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };

  try {
    await ensureArcTestnetChain(provider);

    const treasury = (process.env.NEXT_PUBLIC_ARC_FEE_WALLET ??
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e") as `0x${string}`;

    const feeData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [treasury, ARC_PLATFORM_FEE_UNITS],
    });

    await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: userAddress,
          to: ARC_TESTNET_USDC,
          data: feeData,
          value: "0x0",
        },
      ],
    });

    return {
      ok: true,
      message: `Platform fee ${ARC_PLATFORM_FEE_LABEL} paid on Arc Testnet`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("insufficient") || msg.includes("rejected")) {
      return {
        ok: false,
        skipped: true,
        message: `Arc fee not collected (${msg.slice(0, 60)}) — fund ARC-TESTNET USDC`,
      };
    }
    return { ok: false, message: msg };
  }
}
