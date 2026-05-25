"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getBridgeChains, ARC_FEE_USDC, type ChainOption } from "@/lib/network";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

export function BridgePanel() {
  const { address, isConnected } = useAccount();
  const { network } = useNetwork();
  const chains = getBridgeChains(network);
  const arcChain = chains.find((c) => c.isArc) ?? chains[0];
  const otherChains = chains.filter((c) => !c.isArc);

  const [fromChain, setFromChain] = useState(arcChain?.appKitChain ?? "Arc_Testnet");
  const [toChain, setToChain] = useState(
    otherChains[0]?.appKitChain ?? "Base_Sepolia",
  );
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{
    estimatedFeeUsd?: number;
    estimatedMinutes?: number;
  } | null>(null);

  useEffect(() => {
    const list = getBridgeChains(network);
    const arc = list.find((c) => c.isArc) ?? list[0];
    const others = list.filter((c) => !c.isArc);
    setFromChain(arc?.appKitChain ?? "Arc_Testnet");
    setToChain(others[0]?.appKitChain ?? "Ethereum_Sepolia");
    setEstimate(null);
    setMessage(null);
  }, [network]);

  const fromMeta = chains.find((c) => c.appKitChain === fromChain);
  const toMeta = chains.find((c) => c.appKitChain === toChain);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    try {
      const res = await fetch("/api/execute/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromChain: fromMeta?.label ?? fromChain,
          toChain: toMeta?.label ?? toChain,
          amount,
          network,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Estimate failed");
      setEstimate(data);

      if (isConnected && window.ethereum) {
        try {
          const { AppKit } = await import("@circle-fin/app-kit");
          const { createViemAdapterFromProvider } = await import(
            "@circle-fin/adapter-viem-v2"
          );
          const kit = new AppKit();
          const adapter = await createViemAdapterFromProvider({
            provider: window.ethereum as never,
          });
          const live = await kit.estimateBridge({
            from: { adapter, chain: fromChain as never },
            to: { adapter, chain: toChain as never },
            amount,
          });
          setMessage(
            `Circle CCTP live quote · fees ${JSON.stringify(live.fees ?? {})} · ${ARC_FEE_USDC}`,
          );
        } catch {
          setMessage(`Route ready · ${data.settlement ?? ARC_FEE_USDC}`);
        }
      } else {
        setMessage(data.note ?? `Est. ${ARC_FEE_USDC}`);
      }
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Estimate failed");
    }
  }, [fromChain, toChain, amount, isConnected, fromMeta, toMeta, network]);

  const runBridge = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      setStatus("error");
      setMessage("Click Connect Wallet first, then fund USDC on Arc / Base Sepolia.");
      return;
    }

    setStatus("executing");
    try {
      const { AppKit } = await import("@circle-fin/app-kit");
      const { createViemAdapterFromProvider } = await import(
        "@circle-fin/adapter-viem-v2"
      );
      const kit = new AppKit();
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as never,
      });

      const result = await kit.bridge({
        from: { adapter, chain: fromChain as never },
        to: { adapter, chain: toChain as never },
        amount,
      });

      pushTx({
        type: "bridge",
        status: "success",
        summary: `Bridge ${amount} USDC ${fromMeta?.label} → ${toMeta?.label}`,
        chain: fromChain,
        feeUsd: "0.01",
      });
      setStatus("success");
      setMessage(
        `Bridge submitted · ${result.state ?? "pending"} · Paid in USDC on Arc (~$0.01).`,
      );
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      pushTx({ type: "bridge", status: "error", summary: err.slice(0, 80) });
      setStatus("error");
      setMessage(
        err.includes("balance") || err.includes("insufficient")
          ? `${err} — Use Fund tab (Circle faucet) on ${fromMeta?.label}.`
          : err,
      );
    }
  }, [fromChain, toChain, amount, isConnected, fromMeta, toMeta]);

  return (
    <div className="panel-elevated rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-3 text-violet-300">
          <ArrowRightLeft className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">CCTP Bridge</h3>
          <p className="text-sm text-slate-300">
            Cross-chain USDC · {ARC_FEE_USDC} · {network}
          </p>
        </div>
      </div>

      <ChainSelect
        label="From"
        value={fromChain}
        chains={chains}
        onChange={setFromChain}
      />
      <ChainSelect
        label="To"
        value={toChain}
        chains={chains}
        onChange={setToChain}
        className="mt-3"
      />
      <label className="mt-3 block">
        <span className="text-xs uppercase text-slate-400">USDC amount</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 font-mono text-white"
        />
      </label>

      {estimate && (
        <div className="mt-4 rounded-xl bg-cyan-950/50 border border-cyan-500/20 p-4 text-sm text-cyan-100">
          Fee ~${(estimate.estimatedFeeUsd ?? 0.01).toFixed(4)} · ~
          {estimate.estimatedMinutes ?? 2} min · Circle CCTP v2
        </div>
      )}

      {message && <StatusBox status={status} message={message} />}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={runEstimate} className="btn-secondary">
          {status === "estimating" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Estimate Route"}
        </button>
        <button type="button" onClick={runBridge} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold text-white">
          {status === "executing" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute Bridge"}
        </button>
      </div>
    </div>
  );
}

function ChainSelect({
  label,
  value,
  chains,
  onChange,
  className,
}: {
  label: string;
  value: string;
  chains: ChainOption[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs uppercase text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.appKitChain}>
            {c.label}
            {c.isArc ? " ★ Arc" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBox({ status, message }: { status: Status; message: string }) {
  return (
    <div
      className={`mt-4 flex gap-2 rounded-xl p-4 text-sm ${
        status === "error"
          ? "bg-rose-950/80 text-rose-100 border border-rose-500/30"
          : status === "success"
            ? "bg-emerald-950/80 text-emerald-100 border border-emerald-500/30"
            : "bg-slate-900/90 text-slate-200 border border-slate-700"
      }`}
    >
      {status === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : status === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : null}
      {message}
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
