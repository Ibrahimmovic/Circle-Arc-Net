"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  getBridgeChains,
  describeBridgeFees,
  describeTestnetArcHubFees,
  formatKitGasFees,
  TESTNET_HOME_CHAIN,
  type ChainOption,
} from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import {
  getBridgeKitConfig,
  getBridgeDestination,
} from "@/lib/kit-operations";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import { FeeHint } from "./fee-hint";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

export function BridgePanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network, isTestnet } = useNetwork();
  const chains = getBridgeChains(network);
  const otherChains = chains.filter((c) => !c.isArc);
  const arcOnly = isTestnet;

  const defaultRemote = otherChains[0]?.appKitChain ?? "Base_Sepolia";
  const [inboundFrom, setInboundFrom] = useState(defaultRemote);
  const [toChain, setToChain] = useState(defaultRemote);
  const [mainnetFrom, setMainnetFrom] = useState(
    chains[0]?.appKitChain ?? "Ethereum",
  );
  const [mainnetTo, setMainnetTo] = useState(
    chains[1]?.appKitChain ?? "Base",
  );
  const [inboundMode, setInboundMode] = useState(false);
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [gasLines, setGasLines] = useState<
    Array<{ step: string; chain: string; token: string }>
  >([]);
  const [estimate, setEstimate] = useState<{
    estimatedMinutes?: number;
  } | null>(null);

  const effectiveFrom = arcOnly
    ? inboundMode
      ? inboundFrom
      : TESTNET_HOME_CHAIN
    : mainnetFrom;
  const effectiveTo = arcOnly
    ? inboundMode
      ? TESTNET_HOME_CHAIN
      : toChain
    : mainnetTo;

  const feeInfo = useMemo(
    () => describeBridgeFees(effectiveFrom, effectiveTo, network),
    [effectiveFrom, effectiveTo, network],
  );

  const requiredChainId =
    arcOnly && !inboundMode
      ? defaultWalletChainId
      : wagmiChainIdForAppKit(effectiveFrom) ?? defaultWalletChainId;
  const fromMeta = chains.find((c) => c.appKitChain === effectiveFrom);
  const toMeta = chains.find((c) => c.appKitChain === effectiveTo);
  const needsSwitch = isConnected && chainId !== requiredChainId;

  useEffect(() => {
    installCircleProxyFetch();
    const list = getBridgeChains(network);
    const others = list.filter((c) => !c.isArc);
    setInboundFrom(others[0]?.appKitChain ?? "Base_Sepolia");
    setToChain(others[0]?.appKitChain ?? "Base_Sepolia");
    setInboundMode(false);
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
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const { createViemAdapterFromProvider } = await import(
          "@circle-fin/adapter-viem-v2"
        );
        const kit = new AppKit();
        const adapter = await createViemAdapterFromProvider({
          provider: window.ethereum as never,
        });
        const live = await kit.estimateBridge({
          from: { adapter, chain: effectiveFrom as never },
          to: getBridgeDestination(
            effectiveTo,
            adapter,
            network,
          ) as never,
          amount,
          config: getBridgeKitConfig(),
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
  }, [effectiveFrom, effectiveTo, amount, isConnected, network]);

  const runBridge = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      setStatus("error");
      setMessage("Connect wallet first. Fund USDC on the source chain (Fund tab).");
      return;
    }
    if (needsSwitch) {
      setStatus("error");
      setMessage(
        arcOnly
          ? "Switch wallet to Arc Testnet — testnet hub uses Arc USDC for outbound bridges."
          : `Switch wallet to ${fromMeta?.label ?? effectiveFrom}.`,
      );
      return;
    }

    setStatus("executing");
    try {
      installCircleProxyFetch();
      const { AppKit } = await import("@circle-fin/app-kit");
      const { createViemAdapterFromProvider } = await import(
        "@circle-fin/adapter-viem-v2"
      );
      const kit = new AppKit();
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as never,
      });

      const result = await kit.bridge({
        from: { adapter, chain: effectiveFrom as never },
        to: getBridgeDestination(effectiveTo, adapter, network) as never,
        amount,
        config: getBridgeKitConfig(),
      });

      const feeNote =
        effectiveFrom === TESTNET_HOME_CHAIN
          ? "Signed on Arc · USDC gas · forwarder mints on destination."
          : `Source gas on ${fromMeta?.label}; Arc receives via CCTP.`;

      pushTx({
        type: "bridge",
        status: "success",
        summary: `Bridge ${amount} USDC ${fromMeta?.label} → ${toMeta?.label}`,
        chain: effectiveFrom,
        feeUsd: effectiveFrom === TESTNET_HOME_CHAIN ? "Arc USDC" : "source",
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
    effectiveFrom,
    effectiveTo,
    amount,
    isConnected,
    fromMeta,
    toMeta,
    needsSwitch,
    network,
    arcOnly,
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
        summary={arcOnly ? describeTestnetArcHubFees() : feeInfo.summary}
        lines={
          arcOnly
            ? undefined
            : [feeInfo.sourceLine, feeInfo.destLine]
        }
      />

      {arcOnly && (
        <div className="mt-4 flex gap-2 rounded-xl border border-slate-700 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setInboundMode(false)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              !inboundMode
                ? "bg-cyan-500/20 text-cyan-100"
                : "text-slate-400"
            }`}
          >
            Out from Arc (Arc USDC only)
          </button>
          <button
            type="button"
            onClick={() => setInboundMode(true)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
              inboundMode
                ? "bg-amber-500/15 text-amber-100"
                : "text-slate-400"
            }`}
          >
            Inbound to Arc (source chain gas)
          </button>
        </div>
      )}

      {needsSwitch && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: requiredChainId })}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100"
        >
          {switching
            ? "Switching…"
            : arcOnly
              ? "Switch wallet to Arc Testnet"
              : `Switch to ${fromMeta?.label}`}
        </button>
      )}

      {arcOnly && !inboundMode ? (
        <>
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
            <span className="text-slate-500 text-xs uppercase">From</span>
            <p className="font-medium text-cyan-100">Arc Testnet ★</p>
          </div>
          <ChainSelect
            label="To"
            value={toChain}
            chains={otherChains}
            onChange={setToChain}
            className="mt-3"
          />
        </>
      ) : arcOnly && inboundMode ? (
        <>
          <ChainSelect
            label="From (source chain — gas on this chain)"
            value={inboundFrom}
            chains={otherChains}
            onChange={setInboundFrom}
            className="mt-4"
          />
          <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <span className="text-slate-500 text-xs uppercase">To</span>
            <p className="font-medium text-cyan-100">Arc Testnet ★</p>
          </div>
        </>
      ) : (
        <>
          <ChainSelect
            label="From"
            value={mainnetFrom}
            chains={chains}
            onChange={setMainnetFrom}
            className="mt-4"
          />
          <ChainSelect
            label="To"
            value={mainnetTo}
            chains={chains}
            onChange={setMainnetTo}
            className="mt-3"
          />
        </>
      )}
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
