"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowDown,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { useNetwork } from "@/providers/network-context";
import {
  getExecChains,
  getExecTokens,
  findExecToken,
} from "@/lib/execution/chain-catalog";
import { executeLifiIntent } from "@/lib/execution/execute-lifi-intent";
import { executeCircleDirectIntent } from "@/lib/execution/execute-circle-intent";
import type { CrossChainRouteOption } from "@/lib/lifi-routes";
import { CrossChainRouteCard } from "@/components/execute/cross-chain-route-card";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { RecipientField } from "@/components/ui/recipient-field";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const SendPanel = dynamic(() => import("./send-panel").then((m) => m.SendPanel), {
  ssr: false,
});
const FaucetPanel = dynamic(() => import("./faucet-panel").then((m) => m.FaucetPanel), {
  ssr: false,
});
const ActivityFeed = dynamic(
  () => import("@/components/dashboard/activity-feed").then((m) => m.ActivityFeed),
  { ssr: false },
);

type UtilityTab = "send" | "fund" | "activity" | null;

export function CrossChainStudio() {
  const { address, isConnected } = useAccount();
  const { network, isTestnet } = useNetwork();
  const chains = useMemo(() => getExecChains(network), [network]);

  const [fromChain, setFromChain] = useState(
    isTestnet ? "Base_Sepolia" : "Base",
  );
  const [toChain, setToChain] = useState(
    isTestnet ? "Ethereum_Sepolia" : "Ethereum",
  );
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("WETH");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showRecipient, setShowRecipient] = useState(false);

  const [routes, setRoutes] = useState<CrossChainRouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [utility, setUtility] = useState<UtilityTab>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromTokens = useMemo(
    () => getExecTokens(fromChain, network),
    [fromChain, network],
  );
  const toTokens = useMemo(() => getExecTokens(toChain, network), [toChain, network]);
  const toMeta = findExecToken(toChain, toToken, network);
  const fromMeta = findExecToken(fromChain, fromToken, network);

  const selectedRoute = routes.find((r) => r.id === selectedId) ?? routes[0];

  const flip = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const fetchRoutes = useCallback(async () => {
    if (!address || !amount || Number(amount) <= 0) {
      setRoutes([]);
      setSelectedId(null);
      return;
    }
    setQuoteLoading(true);
    try {
      const res = await fetch(`/api/execute/routes?network=${network}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromChain,
          toChain,
          fromToken,
          toToken,
          amount,
          fromAddress: address,
          toAddress: recipient.trim() || address,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load routes");
      const list = (json.routes ?? []) as CrossChainRouteOption[];
      setRoutes(list);
      setSelectedId(list.find((r) => r.executable)?.id ?? list[0]?.id ?? null);
      setStatus("idle");
      setMessage(null);
    } catch (e) {
      setRoutes([]);
      setMessage(e instanceof Error ? e.message : "Route fetch failed");
      setStatus("error");
    } finally {
      setQuoteLoading(false);
    }
  }, [
    address,
    amount,
    network,
    fromChain,
    toChain,
    fromToken,
    toToken,
    recipient,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchRoutes();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRoutes]);

  useEffect(() => {
    if (isTestnet) {
      setFromChain("Base_Sepolia");
      setToChain("Ethereum_Sepolia");
    } else {
      setFromChain("Base");
      setToChain("Ethereum");
    }
  }, [isTestnet]);

  const setPct = (pct: number) => {
    setMessage("Enter balance sync — or type amount (MAX uses full field next).");
    if (pct === 100) setAmount((prev) => prev || "100");
  };

  const execute = async () => {
    if (!address || !selectedRoute?.executable) return;
    setExecuting(true);
    setMessage(null);
    const intent = {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
    };
    try {
      if (selectedRoute.circleDirect) {
        const res = await executeCircleDirectIntent({
          intent,
          fromAddress: address,
          testnet: isTestnet,
          onProgress: setMessage,
        });
        setMessage(res.message);
        setStatus("ok");
      } else {
        const { txHash, tool } = await executeLifiIntent({
          intent,
          fromAddress: address,
          testnet: isTestnet,
          mode: network,
          onProgress: setMessage,
        });
        setMessage(`Done · ${tool ?? "LI.FI"} · ${txHash.slice(0, 14)}…`);
        setStatus("ok");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Transaction failed");
      setStatus("error");
    } finally {
      setExecuting(false);
    }
  };

  const fromLabel = chains.find((c) => c.appKitChain === fromChain)?.label ?? fromChain;
  const toLabel = chains.find((c) => c.appKitChain === toChain)?.label ?? toChain;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/80 via-slate-950 to-cyan-950/40 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <h2 className="relative text-xl font-bold text-white sm:text-2xl">
          Cross-chain execution
        </h2>
        <p className="relative mt-2 max-w-xl text-sm text-slate-300">
          Say what you want — we route bridge, swap, and delivery in one flow. Like
          Jumper: compare providers, pick the best path, sign once when possible.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send */}
        <div className="luxury-card space-y-4 rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            You send
          </p>

          <div className="flex items-center gap-3">
            <TokenAvatar symbol={fromToken} chainKey={fromChain} size={44} />
            <div className="flex-1 space-y-2">
              <select
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {chains.map((c) => (
                  <option key={c.appKitChain} value={c.appKitChain}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
              >
                {fromTokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-4 pl-4 pr-16 text-2xl font-semibold text-white outline-none focus:border-violet-500/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              {fromToken}
            </span>
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPct(p)}
                className="flex-1 rounded-lg border border-slate-700/80 py-1.5 text-xs font-semibold text-slate-400 hover:border-violet-500/40 hover:text-white"
              >
                {p === 100 ? "MAX" : `${p}%`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={flip}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-violet-300 hover:bg-violet-500/20"
            aria-label="Flip direction"
          >
            <ArrowDown className="h-4 w-4 rotate-90 sm:rotate-0" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/40 p-3">
            <TokenAvatar symbol={toToken} chainKey={toChain} size={40} />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase text-slate-500">You receive on</p>
              <select
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
                className="mt-1 w-full rounded-lg border-0 bg-transparent text-sm font-semibold text-white"
              >
                {chains.map((c) => (
                  <option key={c.appKitChain} value={c.appKitChain}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              >
                {toTokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRecipient((v) => !v)}
            className="flex w-full items-center justify-between text-xs text-slate-400"
          >
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Send to another wallet (optional)
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition", showRecipient && "rotate-180")}
            />
          </button>
          {showRecipient && (
            <RecipientField value={recipient} onChange={setRecipient} />
          )}

          {toChain === "Solana" && !isTestnet && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Solana delivery uses LI.FI + a Solana-compatible wallet (e.g. Phantom)
              when routes are available.
            </p>
          )}
        </div>

        {/* Receive / routes */}
        <div className="luxury-card flex flex-col rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              You receive
            </p>
            {quoteLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
            )}
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <span className="text-white">{fromLabel}</span>
            <ArrowRightLeft className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-white">{toLabel}</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {!isConnected && (
              <p className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-6 text-center text-sm text-cyan-100">
                Connect wallet to see live routes
              </p>
            )}
            {isConnected && !amount && (
              <p className="py-8 text-center text-sm text-slate-500">
                Enter an amount to compare routes
              </p>
            )}
            {isConnected &&
              amount &&
              !quoteLoading &&
              routes.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No routes — try USDC ↔ WETH across Base and Ethereum
                </p>
              )}
            {routes.map((r) => (
              <CrossChainRouteCard
                key={r.id}
                route={r}
                toSymbol={toToken}
                toDecimals={toMeta?.decimals ?? 18}
                selected={selectedId === r.id}
                onSelect={() => setSelectedId(r.id)}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={
              !isConnected ||
              executing ||
              !selectedRoute?.executable ||
              quoteLoading
            }
            onClick={execute}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-base font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40"
          >
            {executing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Review & execute"
            )}
          </button>

          {message && (
            <p
              className={cn(
                "mt-3 rounded-xl px-3 py-2 text-xs",
                status === "error"
                  ? "bg-red-500/10 text-red-200"
                  : status === "ok"
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-slate-800 text-slate-300",
              )}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
        {(
          [
            { id: "send" as const, label: "Send to friend" },
            { id: "fund" as const, label: "Get testnet funds" },
            { id: "activity" as const, label: "Activity" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setUtility(utility === id ? null : id)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold",
              utility === id
                ? "border-violet-500/50 bg-violet-500/20 text-white"
                : "border-slate-700 text-slate-400 hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {utility === "send" && <SendPanel />}
      {utility === "fund" && isTestnet && <FaucetPanel />}
      {utility === "activity" && <ActivityFeed expanded />}
    </div>
  );
}
