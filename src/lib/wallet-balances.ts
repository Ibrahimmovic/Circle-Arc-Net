import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import {
  base,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
} from "viem/chains";
import { arcTestnet, APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";
import { getExecTokens } from "@/lib/execution/chain-catalog";
import type { NetworkMode } from "@/lib/network";
import type { ExecuteToken } from "@/lib/execute-tokens";
import { getArcTestnetUsdBalances } from "@/lib/arc-balance";

const RPC: Record<number, string> = {
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://sepolia.base.org",
  11155111: "https://rpc.sepolia.org",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
  11155420: "https://sepolia.optimism.io",
  1: "https://eth.llamarpc.com",
  8453: "https://mainnet.base.org",
  42161: "https://arb1.arbitrum.io/rpc",
  10: "https://mainnet.optimism.io",
  137: "https://polygon-rpc.com",
  43114: "https://api.avax.network/ext/bc/C/rpc",
};

function chainForId(chainId: number) {
  if (chainId === 5042002) return arcTestnet;
  if (chainId === 84532) return baseSepolia;
  if (chainId === 421614) return arbitrumSepolia;
  if (chainId === 11155420) return optimismSepolia;
  if (chainId === 1) return mainnet;
  if (chainId === 8453) return base;
  if (chainId === 42161) return arbitrum;
  if (chainId === 10) return optimism;
  if (chainId === 137) return polygon;
  return undefined;
}

export type TokenBalanceRow = {
  chain: string;
  chainId: number;
  symbol: string;
  balance: string;
  balanceRaw: string;
};

function formatBalance(amount: number, symbol: string): string {
  if (amount === 0) return "0";
  if (symbol === "USDC" || symbol === "EURC" || symbol === "USDT") {
    return amount < 0.01 ? "<0.01" : amount.toFixed(2);
  }
  if (amount < 0.0001) return "<0.0001";
  if (amount < 1) return amount.toFixed(4);
  return amount.toFixed(3);
}

async function tokenBalance(
  client: {
    getBalance: (args: { address: Address }) => Promise<bigint>;
    readContract: (args: {
      address: Address;
      abi: typeof erc20Abi;
      functionName: "balanceOf";
      args: [Address];
    }) => Promise<bigint>;
  },
  user: Address,
  token: ExecuteToken,
  chainId: number,
): Promise<TokenBalanceRow> {
  if (token.address === "0x0000000000000000000000000000000000000000") {
    const native = await client.getBalance({ address: user }).catch(() => BigInt(0));
    const n = Number(formatUnits(native, 18));
    return {
      chain: "",
      chainId,
      symbol: token.symbol,
      balance: formatBalance(n, token.symbol),
      balanceRaw: native.toString(),
    };
  }

  if (chainId === 5042002 && token.symbol === "USDC") {
    const arc = await getArcTestnetUsdBalances(user);
    const n = arc.totalUsd;
    return {
      chain: "",
      chainId,
      symbol: "USDC",
      balance: formatBalance(n, "USDC"),
      balanceRaw: String(Math.floor(n * 1e6)),
    };
  }

  const raw = await client
    .readContract({
      address: token.address as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [user],
    })
    .catch(() => BigInt(0));

  const n = Number(formatUnits(raw, token.decimals));
  return {
    chain: "",
    chainId,
    symbol: token.symbol,
    balance: formatBalance(n, token.symbol),
    balanceRaw: raw.toString(),
  };
}

/** Fetch balances for tokens on one or more App Kit chains. */
export async function fetchWalletBalances(
  address: string,
  appKitChains: string[],
  mode: NetworkMode = "testnet",
): Promise<TokenBalanceRow[]> {
  const user = address as Address;
  const rows: TokenBalanceRow[] = [];

  for (const appKit of [...new Set(appKitChains)]) {
    const chainId = APP_KIT_TO_WAGMI_CHAIN_ID[appKit];
    if (chainId == null || !RPC[chainId]) continue;

    const viemChain = chainForId(chainId);
    if (!viemChain) continue;

    const client = createPublicClient({
      chain: viemChain,
      transport: http(RPC[chainId]),
    });

    const tokens = getExecTokens(appKit, mode);
    for (const token of tokens) {
      const row = await tokenBalance(client, user, token, chainId);
      rows.push({ ...row, chain: appKit });
    }
  }

  return rows;
}

export function balanceKey(chain: string, symbol: string): string {
  return `${chain}:${symbol}`;
}
