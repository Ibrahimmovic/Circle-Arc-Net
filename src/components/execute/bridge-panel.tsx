"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  getBridgeChains,
  describeBridgeFees,
  formatKitGasFees,
  type ChainOption,
} from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import { FeeHint } from "./fee-hint";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

export function BridgePanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
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
  const [gasLines, setGasLines] = useState<
    Array<{ step: string; chain: string; token: string }>
  >([]);
  const [estimate, setEstimate] = useState<{
    estimatedMinutes?: number;
  } | null>(null);

  const feeInfo = useMemo(
    () => describeBridgeFees(fromChain, toChain, network),
    [fromChain, toChain, network],
  );

  const requiredChainId = wagmiChainIdForAppKit(fromChain);
  const fromMeta = chains.find((c) => c.appKitChain === fromChain);
  const toMeta = chains.find((c) => c.appKitChain === toChain);
  const needsSwitch =
    isConnected &&
    requiredChainId != null &&
    chainId !== requiredChainId;

  useEffect(() => {
    const list = getBridgeChains(network);
    const arc = list.find((c) => c.isArc) ?? list[0];
    const others = list.filter((c) => !c.isArc);
    setFromChain(arc?.appKitChain ?? "Arc_Testnet");
    setToChain(others[0]?.appKitChain ?? "Ethereum_Sepolia");
    setEstimate(null);
    setMessage(null);
    setGasLines([]);
  }, [network]);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    setGasLines([]);
    try {
      if (isConnected && window.ethereum) {
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
        setGasLines(formatKitGasFees(live.gasFees));
        const protocol = live.fees
          ?.map((f) => `${f.type}: ${f.amount ?? "—"} USDC`)
          .join(" · ");
        setMessage(
          protocol
            ? `Circle CCTP quote · ${protocol}`
            : "Circle CCTP route ready — fees per chain below.",
        );
        setEstimate({ estimatedMinutes: 2 });
      } else {
        setMessage("Connect wallet on Arc Testnet (or source chain) for live fee breakdown.");
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
      setMessage("Connect wallet first. Fund USDC on the source chain (Fund tab).");
      return;
    }
    if (needsSwitch && requiredChainId) {
      setStatus("error");
      setMessage(
        `Switch wallet to ${fromMeta?.label ?? fromChain} — fees are paid in gas on the source chain.`,
      );
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

      const feeNote = fromChain === "Arc_Testnet"
        ? "Gas paid in Arc USDC on source."
        : `Gas paid on ${fromMeta?.label} (source); mint fees on ${toMeta?.label} if applicable.`;

      pushTx({
        type: "bridge",
        status: "success",
        summary: `Bridge ${amount} USDC ${fromMeta?.label} → ${toMeta?.label}`,
        chain: fromChain,
        feeUsd: fromChain === "Arc_Testnet" ? "Arc USDC" : "source chain",
      });
      setStatus("success");
      setMessage(`Bridge submitted · ${result.state ?? "pending"} · ${feeNote}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      pushTx({ type: "bridge", status: "error", summary: err.slice(0, 80) });
      setStatus("error");
      setMessage(
        err.includes("balance") || err.includes("insufficient")
          ? `${err} — Fund USDC on ${fromMeta?.label} via Fund tab.`
          : err,
      );
    }
  }, [
    fromChain,
    toChain,
    amount,
    isConnected,
    fromMeta,
    toMeta,
    needsSwitch,
    requiredChainId,
  ]);

  return (
    <div className="panel-elevated rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-3 text-violet-300">
          <ArrowRightLeft className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">CCTP Bridge</h3>
          <p className="text-sm text-slate-300">
            Fees on the chain you use — Arc USDC when Arc is source or swap hub
          </p>
        </div>
      </div>

      <FeeHint
        summary={feeInfo.summary}
        lines={[feeInfo.sourceLine, feeInfo.destLine]}
      />

      {needsSwitch && requiredChainId && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: requiredChainId })}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100"
        >
          {switching
            ? "Switching…"
            : `Switch wallet to ${fromMeta?.label} (required for this bridge)`}
        </button>
      )}

      <ChainSelect
        label="From"
        value={fromChain}
        chains={chains}
        onChange={setFromChain}
        className="mt-4"
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

      {gasLines.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-xs text-slate-300">
          <p className="mb-2 font-semibold uppercase tracking-wide text-slate-400">
            Circle fee breakdown
          </p>
          <ul className="space-y-1">
            {gasLines.map((g) => (
              <li key={`${g.step}-${g.chain}`}>
                {g.step}: {g.token} on {g.chain}
              </li>
            ))}
          </ul>
        </div>
      )}

      {estimate && (
        <div className="mt-4 rounded-xl bg-cyan-950/50 border border-cyan-500/20 p-4 text-sm text-cyan-100">
          ~{estimate.estimatedMinutes ?? 2} min · Circle CCTP v2
        </div>
      )}

      {message && <StatusBox status={status} message={message} />}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={runEstimate} className="btn-secondary">
          {status === "estimating" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Estimate Route"
          )}
        </button>
        <button
          type="button"
          onClick={runBridge}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold text-white"
        >
          {status === "executing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Execute Bridge"
          )}
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
      {status === "success" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : status === "error" ? (
        <AlertCircle className="h-5 w-5 shrink-0" />
      ) : null}
      {message}
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
