"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  ArrowRight,
  ArrowDownUp,
  Loader2,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { getBridgeChains, TESTNET_HOME_CHAIN } from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import {
  getBridgeKitConfig,
  getBridgeDestination,
  getSwapKitConfig,
} from "@/lib/kit-operations";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import {
  getTokensForChain,
  getSwapChain,
  useCircleCctpBridge,
  toBaseUnits,
  getTestnetSwapChains,
} from "@/lib/execute-tokens";
import { formatLifiOutput } from "@/lib/lifi";
import { bridgeSubmitStatus } from "@/lib/bridge-status";
import { TokenAvatar } from "./token-avatar";
import { TokenPicker } from "./token-picker";
import { ArcFeeBadge } from "./arc-fee-badge";
import { RecipientField } from "@/components/ui/recipient-field";
import type { ChainOption } from "@/lib/network";

type Status = "idle" | "loading" | "success" | "error";
type PickerSide = "from" | "to" | null;

export function ExchangeWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network, isTestnet } = useNetwork();
  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  const chains: ChainOption[] = useMemo(
    () => (isTestnet ? getTestnetSwapChains() : getBridgeChains(network)),
    [isTestnet, network],
  );

  const [fromChain, setFromChain] = useState(TESTNET_HOME_CHAIN);
  const [toChain, setToChain] = useState("Base_Sepolia");
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showRecipient, setShowRecipient] = useState(false);
  const [picker, setPicker] = useState<PickerSide>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [quoteOut, setQuoteOut] = useState<string | null>(null);

  const fromMeta = chains.find((c) => c.appKitChain === fromChain);
  const toMeta = chains.find((c) => c.appKitChain === toChain);
  const fromTokens = getTokensForChain(fromChain);
  const toTokens = getTokensForChain(toChain);
  const fromTokenMeta = fromTokens.find((t) => t.symbol === fromToken) ?? fromTokens[0];
  const toTokenMeta = toTokens.find((t) => t.symbol === toToken) ?? toTokens[0];

  const isSameChain = fromChain === toChain;
  const isSwap = isSameChain && fromToken !== toToken;
  const isBridge = !isSameChain;
  const useCctp =
    isBridge &&
    fromTokenMeta &&
    toTokenMeta &&
    useCircleCctpBridge(fromChain, toChain, fromTokenMeta, toTokenMeta);

  const execChainId =
    wagmiChainIdForAppKit(fromChain) ?? defaultWalletChainId;
  const arcChainId = defaultWalletChainId;
  const needsSwitch = isConnected && chainId !== execChainId;
  const needsArcForFees = isConnected && isTestnet && chainId !== arcChainId;

  useEffect(() => {
    installCircleProxyFetch();
    const list = isTestnet ? getTestnetSwapChains() : getBridgeChains(network);
    setFromChain(TESTNET_HOME_CHAIN);
    setToChain(list.find((c) => !c.isArc)?.appKitChain ?? "Base_Sepolia");
    setFromToken("USDC");
    setToToken("USDC");
    setAmount("");
    setMessage(null);
    setQuoteOut(null);
  }, [network, isTestnet]);

  const swapEnds = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromToken(toToken);
    setToToken(fromToken);
    setQuoteOut(null);
  };

  const getAdapter = useCallback(async () => {
    if (!window.ethereum) throw new Error("Connect wallet");
    const { createViemAdapterFromProvider } = await import(
      "@circle-fin/adapter-viem-v2"
    );
    return createViemAdapterFromProvider({ provider: window.ethereum as never });
  }, []);

  const runQuote = useCallback(async () => {
    if (!isConnected || !address) {
      setStatus("error");
      setMessage("Connect wallet first.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus("error");
      setMessage("Enter an amount.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    setQuoteOut(null);

    try {
      if (isSwap && fromChain === TESTNET_HOME_CHAIN && fromTokenMeta?.circleKey && toTokenMeta?.circleKey && kitKey) {
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        const est = await kit.estimateSwap({
          from: { adapter, chain: fromChain as never },
          tokenIn: fromTokenMeta.circleKey as never,
          tokenOut: toTokenMeta.circleKey as never,
          amountIn: amount,
          config: getSwapKitConfig(kitKey),
        });
        setQuoteOut(`${est.estimatedOutput?.amount ?? "—"} ${toToken}`);
        setMessage("Swap on Arc · fee in Arc USDC");
        setStatus("idle");
        return;
      }

      if (isBridge && useCctp && fromToken === "USDC") {
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        await kit.estimateBridge({
          from: { adapter, chain: fromChain as never },
          to: getBridgeDestination(toChain, adapter, network, recipient) as never,
          amount,
          config: getBridgeKitConfig(),
          token: "USDC",
        });
        setQuoteOut(`${amount} ${toToken} on ${toMeta?.label ?? toChain}`);
        setMessage("CCTP bridge · fee in Arc USDC");
        setStatus("idle");
        return;
      }

      const fromCfg = getSwapChain(fromChain);
      const toCfg = getSwapChain(toChain);
      if (!fromCfg || !toCfg || !fromTokenMeta || !toTokenMeta) {
        throw new Error("Route not supported");
      }

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
      if (!res.ok) throw new Error(data.error ?? "No route");

      setQuoteOut(formatLifiOutput(data, toToken));
      setMessage(
        isSwap
          ? `Swap on ${fromMeta?.label} · Agora fee: Arc USDC`
          : `Bridge via LI.FI · Agora fee: Arc USDC`,
      );
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Quote failed");
    }
  }, [
    isConnected,
    address,
    amount,
    isSwap,
    isBridge,
    useCctp,
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromTokenMeta,
    toTokenMeta,
    kitKey,
    network,
    recipient,
    toMeta,
    fromMeta,
    getAdapter,
  ]);

  const runExchange = useCallback(async () => {
    if (!isConnected || !address) {
      setStatus("error");
      setMessage("Connect wallet.");
      return;
    }
    if (needsSwitch) {
      switchChain({ chainId: execChainId });
      setMessage(`Switch to ${fromMeta?.label} to sign this route.`);
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus("error");
      setMessage("Enter amount.");
      return;
    }

    setStatus("loading");
    try {
      if (isSwap && fromChain === TESTNET_HOME_CHAIN && fromTokenMeta?.circleKey && toTokenMeta?.circleKey && kitKey) {
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        await kit.swap({
          from: { adapter, chain: fromChain as never },
          tokenIn: fromTokenMeta.circleKey as never,
          tokenOut: toTokenMeta.circleKey as never,
          amountIn: amount,
          config: getSwapKitConfig(kitKey),
        });
        pushTx({ type: "swap", status: "success", summary: `${fromToken}→${toToken}`, feeUsd: "Arc USDC" });
        setStatus("success");
        setMessage("Done · fee paid in Arc USDC");
        return;
      }

      if (isBridge && useCctp && fromToken === "USDC") {
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        const result = await kit.bridge({
          from: { adapter, chain: fromChain as never },
          to: getBridgeDestination(toChain, adapter, network, recipient) as never,
          amount,
          config: getBridgeKitConfig(),
          token: "USDC",
        });
        const submitted = bridgeSubmitStatus(
          typeof result.state === "string" ? result.state : undefined,
        );
        pushTx({
          type: "bridge",
          status: submitted.uiStatus === "error" ? "error" : "success",
          summary: `${fromMeta?.label}→${toMeta?.label}`,
          feeUsd: "Arc USDC",
        });
        setStatus(submitted.uiStatus === "error" ? "error" : "success");
        setMessage(submitted.label);
        return;
      }

      const fromCfg = getSwapChain(fromChain);
      const toCfg = getSwapChain(toChain);
      if (!fromCfg || !toCfg || !fromTokenMeta || !toTokenMeta) throw new Error("Invalid route");

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
      if (!res.ok) throw new Error(data.error ?? "Quote failed");
      const tx = data.transactionRequest;
      if (!tx?.to || !tx?.data) throw new Error("No transaction");

      await (
        window.ethereum as {
          request: (args: { method: string; params: unknown[] }) => Promise<string>;
        }
      ).request({
        method: "eth_sendTransaction",
        params: [{ from: address, to: tx.to, data: tx.data, value: tx.value ?? "0x0" }],
      });

      pushTx({
        type: isSwap ? "swap" : "bridge",
        status: "success",
        summary: `${fromToken}→${toToken}`,
        feeUsd: "Arc USDC",
      });
      setStatus("success");
      setMessage("Submitted · Agora fee: Arc USDC");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed");
    }
  }, [
    isConnected,
    address,
    needsSwitch,
    needsArcForFees,
    execChainId,
    arcChainId,
    switchChain,
    amount,
    isSwap,
    isBridge,
    useCctp,
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromTokenMeta,
    toTokenMeta,
    kitKey,
    network,
    recipient,
    fromMeta,
    toMeta,
    isTestnet,
    getAdapter,
  ]);

  const pct = (p: number) => {
    const v = parseFloat(amount || "0");
    if (!v) return;
    setAmount(String(v * p));
  };

  return (
    <>
      <div className="exchange-widget mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Swap & Bridge</h2>
          <div className="flex gap-1 text-slate-500">
            <Settings2 className="h-4 w-4 opacity-40" />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <button
            type="button"
            onClick={() => setPicker("from")}
            className="exchange-tile rounded-2xl p-3 text-left transition hover:border-violet-500/40"
          >
            <p className="text-[10px] text-slate-500">From</p>
            <div className="mt-2 flex items-center gap-2">
              <TokenAvatar symbol={fromToken} chainKey={fromChain} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-white">{fromToken}</p>
                <p className="truncate text-xs text-slate-400">{fromMeta?.label}</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={swapEnds}
            className="self-center rounded-full border border-slate-600 bg-slate-800/80 p-2 text-slate-300 hover:text-cyan-300"
            aria-label="Flip"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setPicker("to")}
            className="exchange-tile rounded-2xl p-3 text-left transition hover:border-violet-500/40"
          >
            <p className="text-[10px] text-slate-500">To</p>
            <div className="mt-2 flex items-center gap-2">
              <TokenAvatar symbol={toToken} chainKey={toChain} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-white">{toToken}</p>
                <p className="truncate text-xs text-slate-400">{toMeta?.label}</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
            </div>
          </button>
        </div>

        <div className="exchange-tile mt-3 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500">Send</p>
          <div className="mt-2 flex items-center gap-3">
            <TokenAvatar symbol={fromToken} chainKey={fromChain} size={44} />
            <input
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuoteOut(null);
              }}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-3xl font-semibold text-white outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pct(p)}
                className="rounded-lg bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                {p === 1 ? "MAX" : `${p * 100}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <ArcFeeBadge />
        </div>

        {quoteOut && (
          <p className="mt-2 text-center text-sm text-emerald-300/90">
            → {quoteOut}
          </p>
        )}

        {message && (
          <p
            className={`mt-2 text-center text-xs ${
              status === "error" ? "text-rose-300" : status === "success" ? "text-emerald-300" : "text-slate-400"
            }`}
          >
            {message}
          </p>
        )}

        {(needsSwitch || needsArcForFees) && isConnected && (
          <button
            type="button"
            disabled={switching}
            onClick={() =>
              switchChain({
                chainId: needsArcForFees ? arcChainId : execChainId,
              })
            }
            className="mt-3 w-full rounded-xl border border-amber-500/40 py-2 text-xs font-semibold text-amber-100"
          >
            {switching
              ? "Switching…"
              : needsArcForFees
                ? "Switch to Arc (fee wallet)"
                : `Switch to ${fromMeta?.label}`}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowRecipient(!showRecipient)}
          className="mt-2 w-full text-center text-[10px] text-slate-500 hover:text-cyan-400"
        >
          {showRecipient ? "Hide" : "Send to another wallet"}
        </button>
        {showRecipient && (
          <div className="mt-2">
            <RecipientField value={recipient} onChange={setRecipient} />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={runQuote}
            className="btn-secondary flex-1 py-3 text-sm"
          >
            {status === "loading" && !quoteOut ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Quote"
            )}
          </button>
          <button
            type="button"
            onClick={runExchange}
            className="btn-primary flex-[2] rounded-2xl py-3 text-sm font-bold text-white"
          >
            {status === "loading" ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              <>
                Exchange <ArrowRight className="ml-1 inline h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {picker && (
        <TokenPicker
          title={picker === "from" ? "Exchange from" : "Exchange to"}
          chains={chains}
          chainKey={picker === "from" ? fromChain : toChain}
          tokenSymbol={picker === "from" ? fromToken : toToken}
          onSelect={(chain, token) => {
            if (picker === "from") {
              setFromChain(chain);
              setFromToken(token);
            } else {
              setToChain(chain);
              setToToken(token);
            }
            setQuoteOut(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
