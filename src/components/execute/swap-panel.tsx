"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Repeat, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getSwapChains, describeSwapFees } from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { FeeHint } from "./fee-hint";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

const SWAP_PAIRS = [
  { tokenIn: "USDC" as const, tokenOut: "USDT" as const },
  { tokenIn: "USDT" as const, tokenOut: "USDC" as const },
  { tokenIn: "USDC" as const, tokenOut: "EURC" as const },
];

export function SwapPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network } = useNetwork();
  const swapChains = getSwapChains(network);
  const defaultChain =
    swapChains.find((c) => c.isArc)?.appKitChain ??
    swapChains[0]?.appKitChain ??
    "Arc_Testnet";

  const [chain, setChain] = useState(defaultChain);
  const [pairIdx, setPairIdx] = useState(0);
  const [amountIn, setAmountIn] = useState("5");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedOut, setEstimatedOut] = useState<string | null>(null);

  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
  const pair = SWAP_PAIRS[pairIdx];
  const chainMeta = swapChains.find((c) => c.appKitChain === chain);
  const swapFeeText = describeSwapFees(chain);
  const requiredChainId = wagmiChainIdForAppKit(chain);
  const needsSwitch =
    isConnected &&
    requiredChainId != null &&
    chainId !== requiredChainId;

  useEffect(() => {
    const list = getSwapChains(network);
    const def =
      list.find((c) => c.isArc)?.appKitChain ?? list[0]?.appKitChain ?? "Arc_Testnet";
    setChain(def);
    setMessage(null);
    setEstimatedOut(null);
  }, [network]);

  const getAdapter = useCallback(async () => {
    if (!window.ethereum) throw new Error("Connect wallet first");
    const { createViemAdapterFromProvider } = await import(
      "@circle-fin/adapter-viem-v2"
    );
    return createViemAdapterFromProvider({ provider: window.ethereum as never });
  }, []);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    if (!kitKey) {
      setStatus("error");
      setMessage("KIT_KEY missing in Vercel env.");
      return;
    }
    if (!isConnected) {
      setStatus("error");
      setMessage("Connect wallet to estimate swap on Circle Swap Kit.");
      return;
    }
    try {
      const { AppKit } = await import("@circle-fin/app-kit");
      const kit = new AppKit();
      const adapter = await getAdapter();
      const est = await kit.estimateSwap({
        from: { adapter, chain: chain as never },
        tokenIn: pair.tokenIn,
        tokenOut: pair.tokenOut,
        amountIn,
        config: { kitKey },
      });
      const out = est.estimatedOutput?.amount ?? "—";
      setEstimatedOut(`${out} ${est.estimatedOutput?.token ?? pair.tokenOut}`);
      setMessage(describeSwapFees(chain));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Estimate failed");
    }
  }, [isConnected, kitKey, chain, pair, amountIn, getAdapter, chainMeta]);

  const runSwap = useCallback(async () => {
    if (!isConnected || !kitKey) {
      setStatus("error");
      setMessage("Connect wallet + configure KIT_KEY.");
      return;
    }
    if (needsSwitch && requiredChainId) {
      setStatus("error");
      setMessage(
        `Switch wallet to ${chainMeta?.label ?? chain} — swap gas is paid on that chain.`,
      );
      return;
    }
    setStatus("executing");
    try {
      const { AppKit } = await import("@circle-fin/app-kit");
      const kit = new AppKit();
      const adapter = await getAdapter();
      const result = await kit.swap({
        from: { adapter, chain: chain as never },
        tokenIn: pair.tokenIn,
        tokenOut: pair.tokenOut,
        amountIn,
        config: { kitKey },
      });
      pushTx({
        type: "swap",
        status: "success",
        summary: `Swap ${amountIn} ${pair.tokenIn}→${pair.tokenOut} on ${chainMeta?.label}`,
        feeUsd: chain === "Arc_Testnet" ? "Arc USDC" : "source chain",
      });
      setStatus("success");
      setMessage(`Swap submitted on ${chainMeta?.label} · ${describeSwapFees(chain)}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setMessage(
        err.includes("balance") ? `${err} — Fund USDC via Fund tab first.` : err,
      );
    }
  }, [
    isConnected,
    kitKey,
    chain,
    pair,
    amountIn,
    getAdapter,
    chainMeta,
    needsSwitch,
    requiredChainId,
  ]);

  if (swapChains.length === 0) {
    return (
      <div className="panel-elevated rounded-2xl p-6 text-slate-300">
        No swap chains for {network}. Switch network or use Bridge.
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
          <h3 className="font-display text-lg font-bold text-white">Same-Chain Swap</h3>
          <p className="text-sm text-slate-300">
            Circle Swap Kit · fees on the chain you swap on
          </p>
        </div>
      </div>

      <FeeHint summary={swapFeeText} />

      {needsSwitch && requiredChainId && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: requiredChainId })}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100"
        >
          {switching
            ? "Switching…"
            : `Switch wallet to ${chainMeta?.label ?? chain}`}
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-3 mt-4">
        <label className="block sm:col-span-1">
          <span className="text-xs uppercase text-slate-400">Chain</span>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-white"
          >
            {swapChains.map((c) => (
              <option key={c.id} value={c.appKitChain}>
                {c.label}
                {c.isArc ? " ★" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-400">Pair</span>
          <select
            value={pairIdx}
            onChange={(e) => setPairIdx(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-white"
          >
            {SWAP_PAIRS.map((p, i) => (
              <option key={i} value={i}>
                {p.tokenIn} → {p.tokenOut}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-400">Amount</span>
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-mono text-white"
          />
        </label>
      </div>

      {network === "testnet" && (
        <p className="mt-3 text-xs text-cyan-300/80">
          Testnet: swap on <strong>Arc Testnet</strong> (★) — all gas in Arc USDC, not Base Sepolia.
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
          Estimate + Fees
        </button>
        <button type="button" onClick={runSwap} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold text-white">
          Execute Swap
        </button>
      </div>
    </div>
  );
}
