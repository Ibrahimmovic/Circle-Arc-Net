"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { Repeat, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getChains } from "@/lib/network";
import { pushTx } from "@/lib/tx-store";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

const SWAP_PAIRS = [
  { tokenIn: "USDC" as const, tokenOut: "USDT" as const },
  { tokenIn: "USDT" as const, tokenOut: "USDC" as const },
  { tokenIn: "NATIVE" as const, tokenOut: "USDC" as const },
];

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const chains = getChains();
  const [chain, setChain] = useState(chains[0]?.appKitName ?? "Base Sepolia");
  const [pairIdx, setPairIdx] = useState(0);
  const [amountIn, setAmountIn] = useState("5");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedOut, setEstimatedOut] = useState<string | null>(null);
  const [fees, setFees] = useState<string | null>(null);

  const pair = SWAP_PAIRS[pairIdx];
  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  const getAdapter = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet provider");
    return createViemAdapterFromProvider({
      provider: window.ethereum as Parameters<
        typeof createViemAdapterFromProvider
      >[0]["provider"],
    });
  }, []);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    try {
      if (!isConnected || !kitKey) {
        throw new Error(
          !kitKey
            ? "NEXT_PUBLIC_CIRCLE_KIT_KEY missing on server."
            : "Connect wallet for live Swap Kit quote.",
        );
      }
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
      setFees(JSON.stringify(est.fees ?? { note: "~$0.01 USDC on Arc" }));
      setMessage("Circle Swap Kit estimate ready.");
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Swap estimate failed");
    }
  }, [isConnected, kitKey, chain, pair, amountIn, getAdapter]);

  const runSwap = useCallback(async () => {
    if (!isConnected || !kitKey) {
      setStatus("error");
      setMessage("Connect wallet and configure KIT_KEY for Swap Kit.");
      return;
    }
    setStatus("executing");
    try {
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
        summary: `Swap ${amountIn} ${pair.tokenIn} → ${pair.tokenOut} on ${chain}`,
        chain,
        feeUsd: "~0.01",
      });
      setStatus("success");
      setMessage(`Swap submitted via Circle Swap Kit. ${JSON.stringify(result).slice(0, 120)}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      pushTx({
        type: "swap",
        status: "error",
        summary: `Swap failed: ${pair.tokenIn}→${pair.tokenOut}`,
        chain,
      });
      setStatus("error");
      setMessage(
        err.includes("balance") || err.includes("insufficient")
          ? `${err} — Use Fund tab for testnet USDC.`
          : err,
      );
    }
  }, [isConnected, kitKey, chain, pair, amountIn, getAdapter]);

  return (
    <div className="glass-panel glow-border rounded-2xl p-6 ring-1 ring-violet-500/20">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
          <Repeat className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Same-Chain Swap</h3>
          <p className="text-sm text-slate-400">
            Circle Swap Kit · USDC-native fees · testnet supported
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block sm:col-span-2">
          <span className="text-xs uppercase text-slate-500">Chain</span>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white"
          >
            {chains.map((c) => (
              <option key={c.id} value={c.appKitName}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-500">Pair</span>
          <select
            value={pairIdx}
            onChange={(e) => setPairIdx(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white"
          >
            {SWAP_PAIRS.map((p, i) => (
              <option key={i} value={i}>
                {p.tokenIn} → {p.tokenOut}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-500">Amount in</span>
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-white"
          />
        </label>
      </div>

      {address && (
        <p className="mt-3 font-mono text-xs text-slate-500">Wallet: {address}</p>
      )}

      {estimatedOut && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
          <p className="text-emerald-200">Est. output: {estimatedOut}</p>
          {fees && (
            <p className="mt-1 font-mono text-xs text-slate-400">Fees: {fees}</p>
          )}
        </div>
      )}

      {message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl p-4 text-sm ${
            status === "error"
              ? "bg-rose-500/10 text-rose-200"
              : status === "success"
                ? "bg-emerald-500/10 text-emerald-200"
                : "bg-slate-800/80 text-slate-300"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : status === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : null}
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runEstimate}
          disabled={status === "estimating" || status === "executing"}
          className="rounded-xl border border-emerald-500/40 px-5 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {status === "estimating" ? (
            <Loader2 className="inline h-4 w-4 animate-spin" />
          ) : (
            "Estimate Swap + Fees"
          )}
        </button>
        <button
          type="button"
          onClick={runSwap}
          disabled={status === "executing"}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "executing" ? (
            <Loader2 className="inline h-4 w-4 animate-spin" />
          ) : (
            "Execute Swap"
          )}
        </button>
      </div>
    </div>
  );
}
