import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  maxUint256,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { baseSepolia, arbitrumSepolia, optimismSepolia } from "viem/chains";
import { LIFI_TESTNET_TOKENS } from "@/lib/lifi-tokens";
import { toBaseUnits } from "@/lib/execute-tokens";
import { chainIdToHex, withTimeout } from "@/lib/wallet-chain";

/** Uniswap V3 on Base / Arb / OP Sepolia (LiFi has no testnet DEX liquidity). */
export const UNISWAP_V3_TESTNET: Record<
  number,
  { rpc: string; swapRouter: Address; quoter: Address; label: string }
> = {
  84532: {
    rpc: "https://sepolia.base.org",
    swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
    label: "Base Sepolia",
  },
  421614: {
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
    label: "Arbitrum Sepolia",
  },
  11155420: {
    rpc: "https://sepolia.optimism.io",
    swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    quoter: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
    label: "Optimism Sepolia",
  },
};

const FEE_TIERS = [500, 3000, 10000] as const;
const SLIPPAGE_BPS = 300;

const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160, uint32, uint256)",
]);

const swapRouterAbi = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)",
]);

function viemChain(chainId: number) {
  if (chainId === 84532) return baseSepolia;
  if (chainId === 421614) return arbitrumSepolia;
  if (chainId === 11155420) return optimismSepolia;
  return null;
}

export function supportsUniswapV3(chainId: number): boolean {
  return chainId in UNISWAP_V3_TESTNET;
}

const wethAbi = parseAbi([
  "function deposit() payable",
  "function balanceOf(address) view returns (uint256)",
]);

export function isEthToWethWrap(
  chainId: number,
  symbolIn: string,
  symbolOut: string,
): boolean {
  return (
    supportsUniswapV3(chainId) &&
    symbolIn.toUpperCase() === "ETH" &&
    symbolOut.toUpperCase() === "WETH"
  );
}

export function wethAddress(chainId: number): Address {
  const w = LIFI_TESTNET_TOKENS[chainId]?.WETH?.address;
  if (!w) throw new Error("WETH not configured");
  return getAddress(w);
}

/** Native ETH → WETH (deposit) on Base/Arb/OP Sepolia. */
export async function executeEthToWethWrap(
  chainId: number,
  amountEth: string,
  fromAddress: Address,
  onStep?: (msg: string) => void,
): Promise<Hex> {
  const weth = wethAddress(chainId);
  const [whole, frac = ""] = amountEth.split(".");
  const padded = (frac + "0".repeat(18)).slice(0, 18);
  const value = BigInt(`${whole}${padded}`.replace(/^0+/, "") || "0");

  onStep?.("Wallet: wrap ETH → WETH…");
  const data = encodeFunctionData({ abi: wethAbi, functionName: "deposit", args: [] });
  return sendTx({
    from: fromAddress,
    to: weth,
    data,
    value: `0x${value.toString(16)}` as Hex,
    chainId,
  });
}

function resolveToken(chainId: number, symbol: string): { address: Address; decimals: number } | null {
  const entry = LIFI_TESTNET_TOKENS[chainId]?.[symbol.toUpperCase()];
  if (!entry) return null;
  if (entry.address === "0x0000000000000000000000000000000000000000") return null;
  return { address: getAddress(entry.address), decimals: entry.decimals };
}

export interface UniswapQuote {
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  symbolIn: string;
  symbolOut: string;
  amountIn: bigint;
  amountOut: bigint;
  amountOutMin: bigint;
  feeTier: number;
  swapRouter: Address;
}

export async function quoteUniswapV3Swap(
  chainId: number,
  symbolIn: string,
  symbolOut: string,
  amountHuman: string,
): Promise<UniswapQuote> {
  const cfg = UNISWAP_V3_TESTNET[chainId];
  if (!cfg) throw new Error("Uniswap V3 not configured for this chain");

  const tokenIn = resolveToken(chainId, symbolIn);
  const tokenOut = resolveToken(chainId, symbolOut);
  if (!tokenIn || !tokenOut) {
    throw new Error(
      symbolIn === "ETH" || symbolOut === "ETH"
        ? "Use WETH instead of native ETH for Uniswap swaps on testnet."
        : "Token pair not supported for Uniswap on this chain.",
    );
  }

  const amountIn = BigInt(toBaseUnits(amountHuman, tokenIn.decimals));
  const chain = viemChain(chainId);
  const client = createPublicClient({
    chain: chain ?? undefined,
    transport: http(cfg.rpc),
  });

  let best: { amountOut: bigint; feeTier: number } | null = null;

  for (const fee of FEE_TIERS) {
    try {
      const { result } = await client.simulateContract({
        address: cfg.quoter,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn,
            fee,
            sqrtPriceLimitX96: BigInt(0),
          },
        ],
      });
      const out = result[0];
      if (!best || out > best.amountOut) {
        best = { amountOut: out, feeTier: fee };
      }
    } catch {
      /* try next fee tier */
    }
  }

  if (!best) {
    throw new Error(
      `No Uniswap V3 pool for ${symbolIn}→${symbolOut} on ${cfg.label}. Fund both tokens or try another pair.`,
    );
  }

  const amountOutMin = (best.amountOut * BigInt(10000 - SLIPPAGE_BPS)) / BigInt(10000);

  return {
    chainId,
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    symbolIn,
    symbolOut,
    amountIn,
    amountOut: best.amountOut,
    amountOutMin,
    feeTier: best.feeTier,
    swapRouter: cfg.swapRouter,
  };
}

export function uniswapQuoteFromApi(data: {
  chainId: number;
  symbolIn: string;
  symbolOut: string;
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  feeTier: number;
  tokenIn: string;
  tokenOut: string;
  swapRouter: string;
}): UniswapQuote {
  return {
    chainId: data.chainId,
    symbolIn: data.symbolIn,
    symbolOut: data.symbolOut,
    tokenIn: getAddress(data.tokenIn),
    tokenOut: getAddress(data.tokenOut),
    amountIn: BigInt(data.amountIn),
    amountOut: BigInt(data.amountOut),
    amountOutMin: BigInt(data.amountOutMin),
    feeTier: data.feeTier,
    swapRouter: getAddress(data.swapRouter),
  };
}

export function formatUniswapQuoteOut(quote: UniswapQuote): string {
  const outDecimals =
    LIFI_TESTNET_TOKENS[quote.chainId]?.[quote.symbolOut.toUpperCase()]?.decimals ?? 18;
  return `~${formatUnits(quote.amountOut, outDecimals)} ${quote.symbolOut}`;
}

async function sendTx(
  params: { from: Address; to: Address; data: Hex; value?: Hex; chainId: number },
): Promise<Hex> {
  const hash = (await withTimeout(
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
          to: params.to,
          data: params.data,
          value: params.value ?? "0x0",
        },
      ],
    }),
    180_000,
    "Uniswap swap",
  )) as Hex;
  return hash;
}

/** Approve (if needed) + exactInputSingle on the swap chain. */
export async function executeUniswapV3Swap(
  quote: UniswapQuote,
  fromAddress: Address,
  onStep?: (msg: string) => void,
): Promise<{ swapHash: Hex; approveHash?: Hex }> {
  const chain = viemChain(quote.chainId);
  const cfg = UNISWAP_V3_TESTNET[quote.chainId]!;
  const client = createPublicClient({
    chain: chain ?? undefined,
    transport: http(cfg.rpc),
  });

  const allowance = await client.readContract({
    address: quote.tokenIn,
    abi: erc20Abi,
    functionName: "allowance",
    args: [fromAddress, quote.swapRouter],
  });

  let approveHash: Hex | undefined;
  if (allowance < quote.amountIn) {
    onStep?.("Wallet: approve token for Uniswap…");
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [quote.swapRouter, maxUint256],
    });
    approveHash = await sendTx({
      from: fromAddress,
      to: quote.tokenIn,
      data: approveData,
      chainId: quote.chainId,
    });
  }

  onStep?.("Wallet: confirm Uniswap swap…");
  const swapData = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        fee: quote.feeTier,
        recipient: fromAddress,
        amountIn: quote.amountIn,
        amountOutMinimum: quote.amountOutMin,
        sqrtPriceLimitX96: BigInt(0),
      },
    ],
  });

  const swapHash = await sendTx({
    from: fromAddress,
    to: quote.swapRouter,
    data: swapData,
    chainId: quote.chainId,
  });

  return { swapHash, approveHash };
}
