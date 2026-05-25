import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import { baseSepolia, arbitrumSepolia, optimismSepolia } from "viem/chains";
import { arcTestnet, APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";
import { getTokensForChain, type ExecuteToken } from "@/lib/execute-tokens";
import { getArcTestnetUsdBalances } from "@/lib/arc-balance";

const RPC: Record<number, string> = {
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://sepolia.base.org",
  11155111: "https://rpc.sepolia.org",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
  11155420: "https://sepolia.optimism.io",
};

function chainForId(chainId: number) {
  if (chainId === 5042002) return arcTestnet;
  if (chainId === 84532) return baseSepolia;
  if (chainId === 421614) return arbitrumSepolia;
  if (chainId === 11155420) return optimismSepolia;
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
): Promise<TokenBalanceRow[]> {
  const user = address as Address;
  const rows: TokenBalanceRow[] = [];

  for (const appKit of [...new Set(appKitChains)]) {
    const chainId = APP_KIT_TO_WAGMI_CHAIN_ID[appKit];
    if (chainId == null || !RPC[chainId]) continue;

    const client = createPublicClient({
      chain: chainForId(chainId),
      transport: http(RPC[chainId]),
    });

    const tokens = getTokensForChain(appKit);
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
