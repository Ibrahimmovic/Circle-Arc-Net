import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { arcTestnet } from "@/lib/chains";
import { ARC_TESTNET_USDC } from "@/lib/arc-balance";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { chainIdToHex, switchWalletToChain, withTimeout } from "@/lib/wallet-chain";
import { baseSepolia, arbitrumSepolia, optimismSepolia } from "viem/chains";

/** CCTP v2 TokenMessenger + USDC per App Kit chain (testnet). */
const CCTP_USDC: Record<
  string,
  { chainId: number; usdc: Address; tokenMessenger: Address }
> = {
  Arc_Testnet: {
    chainId: 5042002,
    usdc: ARC_TESTNET_USDC,
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  },
  Base_Sepolia: {
    chainId: 84532,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  },
  Ethereum_Sepolia: {
    chainId: 11155111,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  },
  Arbitrum_Sepolia: {
    chainId: 421614,
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  },
  Optimism_Sepolia: {
    chainId: 11155420,
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  },
};

const RPC: Record<number, string> = {
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://sepolia.base.org",
  11155111: "https://rpc.sepolia.org",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
  11155420: "https://sepolia.optimism.io",
};

function viemChainFor(chainId: number) {
  if (chainId === 5042002) return arcTestnet;
  if (chainId === 84532) return baseSepolia;
  if (chainId === 421614) return arbitrumSepolia;
  if (chainId === 11155420) return optimismSepolia;
  return undefined;
}

async function sendApproveTx(params: {
  from: Address;
  usdc: Address;
  spender: Address;
  amount: bigint;
  chainId: number;
}): Promise<Hex> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [params.spender, params.amount],
  });
  return (await withTimeout(
    (
      window.ethereum as {
        request: (args: { method: string; params: unknown[] }) => Promise<Hex>;
      }
    ).request({
      method: "eth_sendTransaction",
      params: [
        {
          chainId: chainIdToHex(params.chainId),
          from: params.from,
          to: params.usdc,
          data,
          value: "0x0",
        },
      ],
    }),
    180_000,
    "USDC approve",
  )) as Hex;
}

/**
 * Standard ERC-20 approve(TokenMessenger, amount) so MetaMask/Rabby show
 * spending limit for the exact bridge amount.
 */
export async function ensureCctpUsdcAllowance(
  userAddress: string,
  appKitChain: string,
  amountHuman: string,
  onStep?: (msg: string) => void,
): Promise<{ approveTx?: Hex; skipped: boolean }> {
  const cfg = CCTP_USDC[appKitChain];
  const chainId = cfg?.chainId ?? wagmiChainIdForAppKit(appKitChain);
  if (!cfg || !chainId || !RPC[chainId]) {
    return { skipped: true };
  }

  const user = userAddress as Address;
  const amount = parseUnits(amountHuman, 6);

  await switchWalletToChain(chainId);

  const client = createPublicClient({
    chain: viemChainFor(chainId),
    transport: http(RPC[chainId]),
  });

  const allowance = await client.readContract({
    address: cfg.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: [user, cfg.tokenMessenger],
  });

  if (allowance >= amount) {
    onStep?.(
      `USDC already approved for CCTP (${formatUnits(allowance, 6)} ≥ ${amountHuman}) — next: bridge burn`,
    );
    return { skipped: true };
  }

  onStep?.(
    `Wallet step: approve ${amountHuman} USDC for Circle CCTP (spender: TokenMessenger)`,
  );

  const approveTx = await sendApproveTx({
    from: user,
    usdc: cfg.usdc,
    spender: cfg.tokenMessenger,
    amount,
    chainId,
  });

  return { approveTx, skipped: false };
}
