"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const CHAINS = [
  "Ethereum",
  "Base",
  "Arbitrum",
  "Polygon",
  "Optimism",
] as const;

type ChainName = (typeof CHAINS)[number];

type Status = "idle" | "estimating" | "executing" | "success" | "error";

function toBridgeChain(name: string): ChainName {
  const clean = name.replace(/ testnet/gi, "").trim();
  if (clean === "Arc") return "Base";
  if ((CHAINS as readonly string[]).includes(clean)) return clean as ChainName;
  return "Ethereum";
}

export function BridgePanel({
  prefillFrom,
  prefillTo,
}: {
  prefillFrom?: string;
  prefillTo?: string;
}) {
  const { address, isConnected } = useAccount();
  const [fromChain, setFromChain] = useState<ChainName>(() =>
    prefillFrom ? toBridgeChain(prefillFrom) : "Ethereum",
  );
  const [toChain, setToChain] = useState<ChainName>(() =>
    prefillTo ? toBridgeChain(prefillTo) : "Base",
  );
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{
    estimatedFeeUsd?: number;
    estimatedMinutes?: number;
  } | null>(null);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    try {
      const res = await fetch("/api/execute/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromChain, toChain, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Estimate failed");
      setEstimate(data);

      if (isConnected && typeof window !== "undefined" && window.ethereum) {
        const kit = new AppKit();
        const adapter = await createViemAdapterFromProvider({
          provider: window.ethereum as Parameters<
            typeof createViemAdapterFromProvider
          >[0]["provider"],
        });
        try {
          const live = await kit.estimateBridge({
            from: { adapter, chain: fromChain },
            to: { adapter, chain: toChain },
            amount,
          });
          setMessage(
            `Live Circle estimate: fees ${JSON.stringify(live.fees ?? live)}`,
          );
        } catch {
          setMessage("Server estimate ready — connect funded wallet for live CCTP quote.");
        }
      } else {
        setMessage(data.note ?? "Server-side route estimate ready.");
      }
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Estimate failed");
    }
  }, [fromChain, toChain, amount, isConnected]);

  const runBridge = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      setStatus("error");
      setMessage("Connect MetaMask or another injected wallet to execute via Circle CCTP.");
      return;
    }

    setStatus("executing");
    setMessage(null);

    try {
      const kit = new AppKit();
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as Parameters<
          typeof createViemAdapterFromProvider
        >[0]["provider"],
      });

      const result = await kit.bridge({
        from: { adapter, chain: fromChain },
        to: { adapter, chain: toChain },
        amount,
      });

      setStatus("success");
      setMessage(
        `Bridge submitted via Circle App Kit. State: ${result.state ?? "pending"}`,
      );
    } catch (e) {
      setStatus("error");
      const err = e instanceof Error ? e.message : String(e);
      setMessage(
        err.includes("insufficient") || err.includes("balance")
          ? `${err} — Fund testnet USDC or use Circle faucet.`
          : err,
      );
    }
  }, [fromChain, toChain, amount, isConnected]);

  return (
    <div className="glass-panel glow-border rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
          <ArrowRightLeft className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">CCTP Bridge</h3>
          <p className="text-sm text-slate-400">
            Cross-chain USDC via Circle App Kit · Arc settlement ~$0.01
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase text-slate-500">From</span>
          <select
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value as ChainName)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white"
          >
            {CHAINS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-500">To</span>
          <select
            value={toChain}
            onChange={(e) => setToChain(e.target.value as ChainName)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white"
          >
            {CHAINS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-slate-500">USDC Amount</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-mono text-white"
          />
        </label>
      </div>

      {address && (
        <p className="mt-3 font-mono text-xs text-slate-500">
          Executor: {address}
        </p>
      )}

      {estimate && (
        <div className="mt-4 rounded-xl bg-slate-900/60 p-4 text-sm text-slate-300">
          Est. fee ~${estimate.estimatedFeeUsd?.toFixed(4)} · ~
          {estimate.estimatedMinutes} min · Circle CCTP v2
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
          className="rounded-xl border border-cyan-500/40 px-5 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
        >
          {status === "estimating" ? (
            <Loader2 className="inline h-4 w-4 animate-spin" />
          ) : (
            "Estimate Route"
          )}
        </button>
        <button
          type="button"
          onClick={runBridge}
          disabled={status === "executing"}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === "executing" ? (
            <Loader2 className="inline h-4 w-4 animate-spin" />
          ) : (
            "Execute Bridge"
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
