import { getAddress, isAddress, isHex } from "viem";
import { getExecChain } from "@/lib/execution/chain-catalog";
import type { NetworkMode } from "@/lib/network";
import { chainIdToHex, switchWalletToChain, withTimeout } from "@/lib/wallet-chain";
import { debitArcPlatformFee } from "@/lib/arc-platform-fee";

export interface ArbitraryExecutionInput {
  chain: string;
  to: string;
  data: string;
  valueEth?: string;
  mode: NetworkMode;
  fromAddress: string;
  testnet: boolean;
}

export async function executeArbitraryCall(
  input: ArbitraryExecutionInput,
  onProgress?: (msg: string) => void,
): Promise<{ txHash: string }> {
  if (!window.ethereum) throw new Error("Connect wallet first.");

  if (!isAddress(input.to)) throw new Error("Invalid contract address.");
  const data = input.data.trim();
  if (!data || !isHex(data)) {
    throw new Error("Calldata must be hex (0x…).");
  }

  const cfg = getExecChain(input.chain, input.mode);
  if (!cfg) throw new Error("Unsupported chain for arbitrary execution.");

  if (input.testnet) {
    onProgress?.("Arc platform fee…");
    const fee = await debitArcPlatformFee(input.fromAddress);
    if (!fee.ok) throw new Error(fee.message);
  }

  onProgress?.(`Switch to ${cfg.label}…`);
  await switchWalletToChain(cfg.wagmiChainId);

  let value = "0x0";
  if (input.valueEth && Number(input.valueEth) > 0) {
    const wei = BigInt(Math.floor(Number(input.valueEth) * 1e18));
    value = `0x${wei.toString(16)}`;
  }

  onProgress?.("Confirm arbitrary call in wallet…");
  const to = getAddress(input.to);
  const hash = (await withTimeout(
    (
      window.ethereum as {
        request: (args: { method: string; params: unknown[] }) => Promise<string>;
      }
    ).request({
      method: "eth_sendTransaction",
      params: [
        {
          chainId: chainIdToHex(cfg.wagmiChainId),
          from: input.fromAddress,
          to,
          data,
          value,
        },
      ],
    }),
    180_000,
    "Arbitrary execution",
  )) as string;

  return { txHash: hash };
}
