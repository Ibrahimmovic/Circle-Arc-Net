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
  summarizeBridgeEstimate,
  BRIDGE_WALLET_STEPS,
} from "@/lib/kit-operations";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import { FeeHint } from "./fee-hint";
import { RecipientField } from "@/components/ui/recipient-field";
import { RouteCard } from "./route-card";
import { AssetRow } from "./asset-row";
import {
  getTokensForChain,
  getSwapChain,
  useCircleCctpBridge,
  toBaseUnits,
} from "@/lib/execute-tokens";
import { formatLifiOutput } from "@/lib/lifi";
import { bridgeSubmitStatus } from "@/lib/bridge-status";

type Status = "idle" | "estimating" | "executing" | "success" | "error";

export function BridgePanel() {
  const { address, isConnected } = useAccount();
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
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [gasLines, setGasLines] = useState<
    Array<{ step: string; chain: string; token: string }>
  >([]);
  const [estimate, setEstimate] = useState<{
    estimatedMinutes?: number;
    totalHint?: string;
  } | null>(null);
  const [feeLines, setFeeLines] = useState<string[]>([]);
  const [confirmExecute, setConfirmExecute] = useState(false);
  const [fromTokenSym, setFromTokenSym] = useState("USDC");
  const [toTokenSym, setToTokenSym] = useState("USDC");
  const [bridgeProvider, setBridgeProvider] = useState<"circle" | "lifi">("circle");

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

  const fromTokens = useMemo(
    () => getTokensForChain(effectiveFrom),
    [effectiveFrom],
  );
  const toTokens = useMemo(() => getTokensForChain(effectiveTo), [effectiveTo]);
  const fromTokenMeta =
    fromTokens.find((t) => t.symbol === fromTokenSym) ?? fromTokens[0];
  const toTokenMeta = toTokens.find((t) => t.symbol === toTokenSym) ?? toTokens[0];
  const useCctp =
    fromTokenMeta &&
    toTokenMeta &&
    useCircleCctpBridge(effectiveFrom, effectiveTo, fromTokenMeta, toTokenMeta);

  useEffect(() => {
    setBridgeProvider(useCctp ? "circle" : "lifi");
  }, [useCctp]);

  useEffect(() => {
    const ft = getTokensForChain(effectiveFrom);
    const tt = getTokensForChain(effectiveTo);
    if (!ft.find((t) => t.symbol === fromTokenSym)) {
      setFromTokenSym(ft[0]?.symbol ?? "USDC");
    }
    if (!tt.find((t) => t.symbol === toTokenSym)) {
      setToTokenSym(tt[0]?.symbol ?? "USDC");
    }
  }, [effectiveFrom, effectiveTo, fromTokenSym, toTokenSym]);

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
    setFeeLines([]);
    setConfirmExecute(false);
  }, [network]);

  const runEstimate = useCallback(async () => {
    setStatus("estimating");
    setMessage(null);
    setGasLines([]);
    setFeeLines([]);
    try {
      if (!isConnected || !window.ethereum) {
        setMessage("Connect wallet for a live quote.");
        setStatus("idle");
        return;
      }

      if (useCctp && fromTokenMeta?.symbol === "USDC") {
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
            recipient,
          ) as never,
          amount,
          config: getBridgeKitConfig(),
          token: "USDC",
        });
        setGasLines(formatKitGasFees(live.gasFees));
        const summary = summarizeBridgeEstimate(
          { gasFees: live.gasFees, fees: live.fees },
          amount,
        );
        setFeeLines(summary.lines);
        const steps =
          summary.walletSteps.length > 0
            ? summary.walletSteps.join(" → ")
            : BRIDGE_WALLET_STEPS;
        setMessage(`Circle CCTP · ${summary.totalHint} · ${steps}`);
        setEstimate({ estimatedMinutes: 15, totalHint: summary.totalHint });
        setBridgeProvider("circle");
        setStatus("idle");
        return;
      }

      const fromCfg = getSwapChain(effectiveFrom);
      const toCfg = getSwapChain(effectiveTo);
      if (!fromCfg || !toCfg || !fromTokenMeta || !toTokenMeta) {
        throw new Error("Unsupported chain or token");
      }

      if (!address) throw new Error("No wallet address");

      const qs = new URLSearchParams({
        fromChain: String(fromCfg.lifiChainId),
        toChain: String(toCfg.lifiChainId),
        fromToken: fromTokenMeta.address,
        toToken: toTokenMeta.address,
        fromAmount: toBaseUnits(amount, fromTokenMeta.decimals),
        fromAddress: address,
      });
      const res = await fetch(`/api/lifi/quote?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "LiFi quote failed");

      setFeeLines([
        `Cross-chain route: ${fromTokenMeta.symbol} on ${fromMeta?.label} → ${toTokenMeta.symbol} on ${toMeta?.label}`,
        `Aggregator: ${data.tool ?? "LI.FI"} (same flow as Jumper / Relay)`,
      ]);
      setMessage(
        `Est. receive: ${formatLifiOutput(data, toTokenSym)} · fees shown in wallet before you sign.`,
      );
      setEstimate({ estimatedMinutes: 5, totalHint: "LI.FI route" });
      setBridgeProvider("lifi");
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Estimate failed");
    }
  }, [
    effectiveFrom,
    effectiveTo,
    amount,
    isConnected,
    network,
    recipient,
    useCctp,
    fromTokenMeta,
    toTokenMeta,
    fromMeta,
    toMeta,
    toTokenSym,
    address,
  ]);

  const runBridge = useCallback(async () => {
    if (!confirmExecute) {
      setConfirmExecute(true);
      setMessage(BRIDGE_WALLET_STEPS);
      return;
    }

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
      if (bridgeProvider === "lifi" && fromTokenMeta && toTokenMeta) {
        const fromCfg = getSwapChain(effectiveFrom);
        const toCfg = getSwapChain(effectiveTo);
        if (!fromCfg || !toCfg || !address) throw new Error("Invalid LiFi route");

        const qs = new URLSearchParams({
          fromChain: String(fromCfg.lifiChainId),
          toChain: String(toCfg.lifiChainId),
          fromToken: fromTokenMeta.address,
          toToken: toTokenMeta.address,
          fromAmount: toBaseUnits(amount, fromTokenMeta.decimals),
          fromAddress: address,
        });
        const res = await fetch(`/api/lifi/quote?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "LiFi quote failed");
        const tx = data.transactionRequest;
        if (!tx?.to || !tx?.data) throw new Error("No transaction from LiFi");

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
          type: "bridge",
          status: "success",
          summary: `${amount} ${fromTokenSym} ${fromMeta?.label}→${toMeta?.label}`,
          chain: effectiveFrom,
        });
        setStatus("success");
        setMessage(`Cross-chain transfer sent · LI.FI · ${hash.slice(0, 10)}…`);
        return;
      }

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
        to: getBridgeDestination(effectiveTo, adapter, network, recipient) as never,
        amount,
        config: getBridgeKitConfig(),
        token: "USDC",
      });

      const submitted = bridgeSubmitStatus(
        typeof result.state === "string" ? result.state : undefined,
      );

      pushTx({
        type: "bridge",
        status: submitted.uiStatus,
        summary: `Bridge ${amount} ${fromTokenSym} ${fromMeta?.label} → ${toMeta?.label}`,
        chain: effectiveFrom,
        feeUsd: effectiveFrom === TESTNET_HOME_CHAIN ? "Arc USDC" : "source",
      });
      setStatus(submitted.uiStatus);
      setMessage(
        `${submitted.label} Signed on source · forwarder may mint on destination without extra signatures.`,
      );
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
    recipient,
    confirmExecute,
    bridgeProvider,
    fromTokenMeta,
    toTokenMeta,
    fromTokenSym,
    address,
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

      <RouteCard
        fromLabel={`${fromMeta?.label ?? effectiveFrom} · ${fromTokenSym}`}
        toLabel={`${toMeta?.label ?? effectiveTo} · ${toTokenSym}`}
        amount={amount}
        token={fromTokenSym}
      />

      <p className="mb-3 text-xs text-slate-500">
        Route:{" "}
        <span className="font-semibold text-violet-300">
          {useCctp ? "Circle CCTP (USDC/EURC stables)" : "LI.FI cross-chain (any token)"}
        </span>
      </p>

      <p className="mb-3 text-xs text-slate-500">{BRIDGE_WALLET_STEPS}</p>

      <RecipientField value={recipient} onChange={setRecipient} />

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
      {arcOnly ? (
        <div className="mt-3 space-y-2">
          <AssetRow
            label="You send"
            chainValue={effectiveFrom}
            chains={chains}
            onChainChange={() => {}}
            readOnlyChain={fromMeta?.label}
            tokenValue={fromTokenSym}
            tokens={fromTokens}
            onTokenChange={setFromTokenSym}
            amount={amount}
            onAmountChange={setAmount}
          />
          <AssetRow
            label="You receive on"
            chainValue={effectiveTo}
            chains={chains}
            onChainChange={() => {}}
            readOnlyChain={toMeta?.label}
            tokenValue={toTokenSym}
            tokens={toTokens}
            onTokenChange={setToTokenSym}
          />
        </div>
      ) : (
        <label className="mt-3 block">
          <span className="text-xs uppercase text-slate-400">USDC amount</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 font-mono text-white"
          />
        </label>
      )}

      {(feeLines.length > 0 || gasLines.length > 0) && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
          <p className="mb-2 font-semibold uppercase tracking-wide text-slate-400">
            Fee estimate (not deducted from amount)
          </p>
          <ul className="space-y-1">
            {feeLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {gasLines.map((g) => (
              <li key={`${g.step}-${g.chain}`}>
                {g.step}: {g.token} on {g.chain}
              </li>
            ))}
          </ul>
        </div>
      )}

      {estimate && (
        <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/40 px-3 py-2 text-xs text-cyan-100">
          SLOW CCTP · ~{estimate.estimatedMinutes ?? 15} min
          {estimate.totalHint ? ` · ${estimate.totalHint}` : ""}
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
          ) : confirmExecute ? (
            "Confirm & sign in wallet"
          ) : (
            "Execute Bridge"
          )}
        </button>
        {confirmExecute && (
          <button
            type="button"
            onClick={() => {
              setConfirmExecute(false);
              setMessage(null);
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}
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
