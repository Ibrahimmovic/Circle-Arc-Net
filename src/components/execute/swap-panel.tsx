"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Repeat, Loader2, ArrowDownUp } from "lucide-react";
import {
  getSwapChains,
  describeSwapFees,
  describeTestnetArcHubFees,
} from "@/lib/network";
import {
  getTokensForChain,
  getSwapChain,
  toBaseUnits,
  type ExecuteToken,
} from "@/lib/execute-tokens";
import { formatLifiOutput } from "@/lib/lifi";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { getSwapKitConfig } from "@/lib/kit-operations";
import { FeeHint } from "./fee-hint";
import { RouteCard } from "./route-card";
import { AssetRow } from "./asset-row";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network, isTestnet } = useNetwork();
  const swapChains = getSwapChains(network);

  const defaultChain = swapChains[0]?.appKitChain ?? "Arc_Testnet";
  const [chainKey, setChainKey] = useState(defaultChain);
  const [tokenIn, setTokenIn] = useState("USDC");
  const [tokenOut, setTokenOut] = useState("EURC");
  const [amountIn, setAmountIn] = useState("1");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedOut, setEstimatedOut] = useState<string | null>(null);
  const [routeTool, setRouteTool] = useState<string | null>(null);

  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
  const chainConfig = getSwapChain(chainKey);
  const tokens = useMemo(() => getTokensForChain(chainKey), [chainKey]);
  const tokenInMeta = tokens.find((t) => t.symbol === tokenIn) ?? tokens[0];
  const tokenOutMeta = tokens.find((t) => t.symbol === tokenOut) ?? tokens[1];
  const useCircle = chainConfig?.swapProvider === "circle";
  const requiredChainId = chainConfig?.wagmiChainId;
  const needsSwitch =
    isConnected && requiredChainId != null && chainId !== requiredChainId;

  useEffect(() => {
    installCircleProxyFetch();
    setMessage(null);
    setEstimatedOut(null);
    setRouteTool(null);
    const list = getSwapChains(network);
    const first = list[0]?.appKitChain ?? "Arc_Testnet";
    setChainKey(first);
    const t = getTokensForChain(first);
    setTokenIn(t[0]?.symbol ?? "USDC");
    setTokenOut(t[1]?.symbol ?? t[0]?.symbol ?? "USDC");
  }, [network]);

  useEffect(() => {
    const t = getTokensForChain(chainKey);
    if (!t.find((x) => x.symbol === tokenIn)) setTokenIn(t[0]?.symbol ?? "USDC");
    if (!t.find((x) => x.symbol === tokenOut)) {
      setTokenOut(t[1]?.symbol ?? t[0]?.symbol ?? "USDC");
    }
  }, [chainKey, tokenIn, tokenOut]);

  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setEstimatedOut(null);
  };

  const getAdapter = useCallback(async () => {
    if (!window.ethereum) throw new Error("Connect wallet first");
    const { createViemAdapterFromProvider } = await import(
      "@circle-fin/adapter-viem-v2"
    );
    return createViemAdapterFromProvider({ provider: window.ethereum as never });
  }, []);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    setEstimatedOut(null);
    if (!isConnected || !address) {
      setStatus("error");
      setMessage("Connect wallet first.");
      return;
    }
    if (needsSwitch) {
      setStatus("error");
      setMessage(`Switch wallet to ${chainConfig?.label ?? "selected chain"}.`);
      return;
    }
    if (tokenIn === tokenOut) {
      setStatus("error");
      setMessage("Pick two different tokens.");
      return;
    }

    try {
      if (useCircle && tokenInMeta?.circleKey && tokenOutMeta?.circleKey) {
        if (!kitKey) {
          setStatus("error");
          setMessage("CIRCLE_KIT_KEY missing in env.");
          return;
        }
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        const est = await kit.estimateSwap({
          from: { adapter, chain: chainKey as never },
          tokenIn: tokenInMeta.circleKey as never,
          tokenOut: tokenOutMeta.circleKey as never,
          amountIn,
          config: getSwapKitConfig(kitKey),
        });
        const out = est.estimatedOutput?.amount ?? "—";
        setEstimatedOut(`${out} ${est.estimatedOutput?.token ?? tokenOut}`);
        setRouteTool("Circle Swap");
        setMessage("Arc swap · fees in Arc USDC · ~1 wallet signature.");
        setStatus("idle");
        return;
      }

      if (!chainConfig || !tokenInMeta || !tokenOutMeta) throw new Error("Invalid chain");

      const fromAmount = toBaseUnits(amountIn, tokenInMeta.decimals);
      const qs = new URLSearchParams({
        fromChain: String(chainConfig.lifiChainId),
        toChain: String(chainConfig.lifiChainId),
        fromToken: tokenInMeta.address,
        toToken: tokenOutMeta.address,
        fromAmount,
        fromAddress: address,
      });
      const res = await fetch(`/api/lifi/quote?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quote failed");

      setEstimatedOut(formatLifiOutput(data, tokenOut));
      setRouteTool(data.tool ? `LI.FI · ${data.tool}` : "LI.FI");
      setMessage(
        `Same-chain swap on ${chainConfig.label} — routed via LI.FI aggregator.`,
      );
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Estimate failed");
    }
  }, [
    isConnected,
    address,
    needsSwitch,
    useCircle,
    kitKey,
    chainKey,
    tokenInMeta,
    tokenOutMeta,
    tokenIn,
    tokenOut,
    amountIn,
    getAdapter,
    chainConfig,
  ]);

  const runSwap = useCallback(async () => {
    if (!isConnected || !address) {
      setStatus("error");
      setMessage("Connect wallet first.");
      return;
    }
    if (needsSwitch) {
      setStatus("error");
      setMessage(`Switch to ${chainConfig?.label}.`);
      return;
    }

    setStatus("executing");
    try {
      if (useCircle && tokenInMeta?.circleKey && tokenOutMeta?.circleKey && kitKey) {
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        await kit.swap({
          from: { adapter, chain: chainKey as never },
          tokenIn: tokenInMeta.circleKey as never,
          tokenOut: tokenOutMeta.circleKey as never,
          amountIn,
          config: getSwapKitConfig(kitKey),
        });
        pushTx({
          type: "swap",
          status: "success",
          summary: `${amountIn} ${tokenIn}→${tokenOut} on Arc`,
          feeUsd: "Arc USDC",
        });
        setStatus("success");
        setMessage(`Swap submitted on Arc · ${describeSwapFees(chainKey)}`);
        return;
      }

      if (!chainConfig || !tokenInMeta || !tokenOutMeta) throw new Error("Invalid route");

      const fromAmount = toBaseUnits(amountIn, tokenInMeta.decimals);
      const qs = new URLSearchParams({
        fromChain: String(chainConfig.lifiChainId),
        toChain: String(chainConfig.lifiChainId),
        fromToken: tokenInMeta.address,
        toToken: tokenOutMeta.address,
        fromAmount,
        fromAddress: address,
      });
      const res = await fetch(`/api/lifi/quote?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quote failed");

      const tx = data.transactionRequest;
      if (!tx?.to || !tx?.data) {
        throw new Error("No transaction returned — try another pair or amount.");
      }

      const hash = await (
        window.ethereum as {
          request: (args: { method: string; params: unknown[] }) => Promise<string>;
        }
      ).request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: tx.to,
            data: tx.data,
            value: tx.value ?? "0x0",
          },
        ],
      });

      pushTx({
        type: "swap",
        status: "success",
        summary: `${tokenIn}→${tokenOut} on ${chainConfig.label}`,
        chain: chainKey,
      });
      setStatus("success");
      setMessage(`Swap sent · ${routeTool ?? "LI.FI"} · ${hash.slice(0, 10)}…`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setMessage(
        err.includes("balance") || err.includes("insufficient")
          ? `${err} — fund ${tokenIn} on ${chainConfig?.label} (Fund tab / faucet).`
          : err,
      );
    }
  }, [
    isConnected,
    address,
    needsSwitch,
    useCircle,
    kitKey,
    chainKey,
    tokenInMeta,
    tokenOutMeta,
    amountIn,
    tokenIn,
    tokenOut,
    getAdapter,
    chainConfig,
    routeTool,
  ]);

  if (!isTestnet && swapChains.length === 0) {
    return (
      <div className="panel-elevated rounded-2xl p-6 text-slate-300">
        No swap chains configured.
      </div>
    );
  }

  return (
    <div className="panel-elevated rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-300">
          <Repeat className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Swap</h3>
          <p className="text-sm text-slate-300">
            Arc: Circle USDC↔EURC · L2 testnets: USDC, USDT, WETH, ETH via LI.FI
          </p>
        </div>
      </div>

      <RouteCard
        fromLabel={`${chainConfig?.label ?? chainKey} · ${tokenIn}`}
        toLabel={`${chainConfig?.label ?? chainKey} · ${tokenOut}`}
        amount={amountIn}
        token={tokenIn}
      />

      <FeeHint
        summary={
          useCircle
            ? describeTestnetArcHubFees()
            : `Swap on ${chainConfig?.label}: pay gas in native token on that chain. Routes aggregated by LI.FI.`
        }
      />

      {needsSwitch && (
        <button
          type="button"
          disabled={switching}
          onClick={() =>
            requiredChainId && switchChain({ chainId: requiredChainId })
          }
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100"
        >
          {switching ? "Switching…" : `Switch wallet to ${chainConfig?.label}`}
        </button>
      )}

      <label className="mt-4 block">
        <span className="text-xs uppercase text-slate-400">Network</span>
        <select
          value={chainKey}
          onChange={(e) => setChainKey(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white"
        >
          {swapChains.map((c) => (
            <option key={c.id} value={c.appKitChain}>
              {c.label}
              {c.isArc ? " ★ Circle" : " · LI.FI"}
            </option>
          ))}
        </select>
      </label>

      <div className="relative mt-3 space-y-2">
        <AssetRow
          label="You pay"
          chainValue={chainKey}
          chains={swapChains}
          onChainChange={() => {}}
          readOnlyChain={chainConfig?.label}
          tokenValue={tokenIn}
          tokens={tokens}
          onTokenChange={setTokenIn}
          amount={amountIn}
          onAmountChange={setAmountIn}
        />
        <button
          type="button"
          onClick={flipTokens}
          className="absolute right-4 top-[42%] z-10 rounded-full border border-slate-600 bg-slate-800 p-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
          aria-label="Flip tokens"
        >
          <ArrowDownUp className="h-4 w-4" />
        </button>
        <AssetRow
          label="You receive"
          chainValue={chainKey}
          chains={swapChains}
          onChainChange={() => {}}
          readOnlyChain={chainConfig?.label}
          tokenValue={tokenOut}
          tokens={tokens}
          onTokenChange={setTokenOut}
        />
      </div>

      {routeTool && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-violet-400">
          Route: {routeTool}
        </p>
      )}

      {estimatedOut && (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-3 text-sm text-emerald-100">
          Est. output: {estimatedOut}
        </div>
      )}

      {message && (
        <div
          className={`mt-4 rounded-xl p-4 text-sm ${
            status === "error"
              ? "bg-rose-950/80 text-rose-100"
              : status === "success"
                ? "bg-emerald-950/80 text-emerald-100"
                : "bg-slate-900 text-slate-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={runEstimate} className="btn-secondary">
          {status === "estimating" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Get quote"
          )}
        </button>
        <button
          type="button"
          onClick={runSwap}
          className="btn-primary rounded-xl px-6 py-2.5 text-sm font-bold text-white"
        >
          {status === "executing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Swap"
          )}
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
