"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Repeat, Loader2 } from "lucide-react";
import {
  getSwapChains,
  describeSwapFees,
  describeTestnetArcHubFees,
  TESTNET_HOME_CHAIN,
} from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { getSwapKitConfig } from "@/lib/kit-operations";
import { FeeHint } from "./fee-hint";
import { RouteCard } from "./route-card";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import { defaultWalletChainId } from "@/providers/wagmi-config";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

/** Arc testnet: USDC, EURC, cirBTC per Circle docs — USDT not supported on Arc testnet. */
const SWAP_PAIRS = [
  { tokenIn: "USDC" as const, tokenOut: "EURC" as const, label: "USDC → EURC" },
  { tokenIn: "EURC" as const, tokenOut: "USDC" as const, label: "EURC → USDC" },
] as const;

export function SwapPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network, isTestnet } = useNetwork();
  const swapChains = getSwapChains(network);
  const chain = TESTNET_HOME_CHAIN;

  const [pairIdx, setPairIdx] = useState(0);
  const [amountIn, setAmountIn] = useState("1");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedOut, setEstimatedOut] = useState<string | null>(null);

  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
  const pair = SWAP_PAIRS[pairIdx];
  const arcChainId = wagmiChainIdForAppKit(chain) ?? defaultWalletChainId;
  const needsSwitch = isConnected && chainId !== arcChainId;

  useEffect(() => {
    installCircleProxyFetch();
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
    setMessage(null);
    if (!kitKey) {
      setStatus("error");
      setMessage("KIT_KEY missing — add CIRCLE_KIT_KEY in Vercel env.");
      return;
    }
    if (!isConnected) {
      setStatus("error");
      setMessage("Connect wallet on Arc Testnet.");
      return;
    }
    if (needsSwitch) {
      setStatus("error");
      setMessage("Switch wallet to Arc Testnet first.");
      return;
    }
    try {
      installCircleProxyFetch();
      const { AppKit } = await import("@circle-fin/app-kit");
      const kit = new AppKit();
      const adapter = await getAdapter();
      const est = await kit.estimateSwap({
        from: { adapter, chain: chain as never },
        tokenIn: pair.tokenIn,
        tokenOut: pair.tokenOut,
        amountIn,
        config: getSwapKitConfig(kitKey),
      });
      const out = est.estimatedOutput?.amount ?? "—";
      setEstimatedOut(`${out} ${est.estimatedOutput?.token ?? pair.tokenOut}`);
      setMessage("Quote ready · one wallet signature if permit works (~1 tx).");
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      const err = e instanceof Error ? e.message : String(e);
      setMessage(
        err.includes("Failed to fetch")
          ? `${err} — redeploy with latest build (Circle API proxy). Try USDC→EURC with funded Arc wallet.`
          : err,
      );
    }
  }, [isConnected, kitKey, pair, amountIn, getAdapter, needsSwitch]);

  const runSwap = useCallback(async () => {
    if (!isConnected || !kitKey) {
      setStatus("error");
      setMessage("Connect wallet + configure KIT_KEY in Vercel.");
      return;
    }
    if (needsSwitch) {
      setStatus("error");
      setMessage("Switch to Arc Testnet — swap fees are Arc USDC only.");
      return;
    }
    setStatus("executing");
    try {
      installCircleProxyFetch();
      const { AppKit } = await import("@circle-fin/app-kit");
      const kit = new AppKit();
      const adapter = await getAdapter();
      await kit.swap({
        from: { adapter, chain: chain as never },
        tokenIn: pair.tokenIn,
        tokenOut: pair.tokenOut,
        amountIn,
        config: getSwapKitConfig(kitKey),
      });
      pushTx({
        type: "swap",
        status: "success",
        summary: `Swap ${amountIn} ${pair.label} on Arc`,
        feeUsd: "Arc USDC",
      });
      setStatus("success");
      setMessage(`Swap submitted on Arc Testnet · ${describeSwapFees(chain)}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setStatus("error");
      setMessage(
        err.includes("balance") || err.includes("insufficient")
          ? `${err} — Fund tab → ARC-TESTNET faucet.`
          : err,
      );
    }
  }, [isConnected, kitKey, pair, amountIn, getAdapter, needsSwitch]);

  if (isTestnet && swapChains.length === 0) {
    return (
      <div className="panel-elevated rounded-2xl p-6 text-slate-300">
        No swap chains for testnet.
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
          <h3 className="font-display text-lg font-bold text-white">
            Arc Testnet Swap
          </h3>
          <p className="text-sm text-slate-300">
            USDC ↔ EURC · fees in Arc USDC · single-chain
          </p>
        </div>
      </div>

      <RouteCard fromLabel="Arc Testnet" toLabel="Arc Testnet" amount={amountIn} />

      <FeeHint
        summary={isTestnet ? describeTestnetArcHubFees() : describeSwapFees(chain)}
      />

      {needsSwitch && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: arcChainId })}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100"
        >
          {switching ? "Switching…" : "Switch wallet to Arc Testnet"}
        </button>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase text-slate-400">Chain</span>
          <div className="mt-1 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-3 text-sm font-medium text-cyan-100">
            Arc Testnet ★ · all fees in Arc USDC
          </div>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-400">Pair</span>
          <select
            value={pairIdx}
            onChange={(e) => setPairIdx(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-white"
          >
            {SWAP_PAIRS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs uppercase text-slate-400">Amount</span>
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-mono text-white"
          />
        </label>
      </div>

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
            "Estimate"
          )}
        </button>
        <button
          type="button"
          onClick={runSwap}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold text-white"
        >
          {status === "executing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Execute Swap"
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
