"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Route,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNetwork } from "@/providers/network-context";
import {
  getTestnetSwapChains,
  getTokensForChain,
} from "@/lib/execute-tokens";
import { executeLifiIntent } from "@/lib/execution/execute-lifi-intent";
import type { IntentRoutePlan } from "@/lib/execution/intent-types";
import { cn } from "@/lib/utils";

const PRESETS = [
  {
    label: "USDC Base → WETH Ethereum",
    fromChain: "Base_Sepolia",
    toChain: "Ethereum_Sepolia",
    fromToken: "USDC",
    toToken: "WETH",
    amount: "25",
  },
  {
    label: "USDC Ethereum → WETH Base",
    fromChain: "Ethereum_Sepolia",
    toChain: "Base_Sepolia",
    fromToken: "USDC",
    toToken: "WETH",
    amount: "25",
  },
  {
    label: "ETH → WETH (same chain)",
    fromChain: "Base_Sepolia",
    toChain: "Base_Sepolia",
    fromToken: "ETH",
    toToken: "WETH",
    amount: "0.01",
  },
] as const;

export function CrossChainIntentPanel() {
  const { address, isConnected } = useAccount();
  const { isTestnet } = useNetwork();
  const chains = useMemo(() => getTestnetSwapChains(), []);

  const [fromChain, setFromChain] = useState("Base_Sepolia");
  const [toChain, setToChain] = useState("Ethereum_Sepolia");
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("WETH");
  const [amount, setAmount] = useState("25");

  const [plan, setPlan] = useState<IntentRoutePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const fromTokens = useMemo(() => getTokensForChain(fromChain), [fromChain]);
  const toTokens = useMemo(() => getTokensForChain(toChain), [toChain]);

  const planRoute = useCallback(async () => {
    if (!address) {
      setMessage("Connect wallet to plan a route.");
      setStatus("error");
      return;
    }
    setLoading(true);
    setMessage(null);
    setStatus("idle");
    try {
      const res = await fetch("/api/execute/intent?network=testnet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromChain,
          toChain,
          fromToken,
          toToken,
          amount,
          fromAddress: address,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Planning failed");
      setPlan(json.plan);
    } catch (e) {
      setPlan(null);
      setMessage(e instanceof Error ? e.message : "Planning failed");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [address, fromChain, toChain, fromToken, toToken, amount]);

  const runIntent = useCallback(async () => {
    if (!address || !plan || plan.strategy !== "lifi_one_shot") return;
    setExecuting(true);
    setMessage(null);
    setStatus("idle");
    try {
      const { txHash, tool } = await executeLifiIntent({
        intent: plan.intent,
        fromAddress: address,
        testnet: isTestnet,
        onProgress: setMessage,
      });
      setMessage(`Submitted · ${tool ?? "LI.FI"} · ${txHash.slice(0, 12)}…`);
      setStatus("ok");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Execution failed");
      setStatus("error");
    } finally {
      setExecuting(false);
    }
  }, [address, plan, isTestnet]);

  if (!isTestnet) {
    return (
      <div className="luxury-card rounded-2xl p-5 text-sm text-slate-400">
        <p>
          Switch to <strong className="text-white">Testnet</strong> in the header to
          use the smart intent demo (Sepolia + Arc). On mainnet, the same pattern
          applies via LI.FI for routes like USDC on Base → token on Solana — one
          signed action when the aggregator has liquidity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="luxury-card rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4 text-sm text-slate-300">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
          <span>
            Say what you <strong className="text-white">want</strong>, not how to
            bridge. Example: “Buy WETH on Ethereum Sepolia using USDC on Base
            Sepolia” — we pick the fastest testnet route (usually{" "}
            <strong className="text-white">one LI.FI transaction</strong> instead
            of bridge → wait → open DEX yourself).
          </span>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Production Solana example (mainnet): USDC on Base → TOKEN on Solana works
          the same way when LI.FI supports the pair — you sign once; the router
          moves, converts, and delivers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setFromChain(p.fromChain);
              setToChain(p.toChain);
              setFromToken(p.fromToken);
              setToToken(p.toToken);
              setAmount(p.amount);
              setPlan(null);
            }}
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/40 hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="luxury-card space-y-4 rounded-2xl p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              You have
            </p>
            <select
              value={fromChain}
              onChange={(e) => {
                setFromChain(e.target.value);
                setPlan(null);
              }}
              className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {chains.map((c) => (
                <option key={c.appKitChain} value={c.appKitChain}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={fromToken}
              onChange={(e) => {
                setFromToken(e.target.value);
                setPlan(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {fromTokens.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              You want
            </p>
            <select
              value={toChain}
              onChange={(e) => {
                setToChain(e.target.value);
                setPlan(null);
              }}
              className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {chains.map((c) => (
                <option key={c.appKitChain} value={c.appKitChain}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={toToken}
              onChange={(e) => {
                setToToken(e.target.value);
                setPlan(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {toTokens.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setPlan(null);
            }}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
            placeholder="Amount"
          />
          <span className="text-slate-500">{fromToken}</span>
          <ArrowRight className="h-4 w-4 text-violet-400" />
          <span className="text-slate-500">{toToken}</span>
        </div>

        <button
          type="button"
          disabled={!isConnected || loading}
          onClick={planRoute}
          className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600/80 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Route className="h-4 w-4" />
          )}
          Find best route
        </button>
      </div>

      {plan && (
        <div className="luxury-card space-y-3 rounded-2xl p-4">
          <p className="text-sm text-white">{plan.summary}</p>
          {plan.savingsNote && (
            <p className="text-xs text-emerald-300/90">{plan.savingsNote}</p>
          )}
          <ol className="space-y-2 border-l border-slate-700 pl-3">
            {plan.steps.map((s) => (
              <li key={s.order} className="text-xs text-slate-400">
                <span className="text-slate-500">{s.order}.</span> {s.label}
                {s.chain && (
                  <span className="text-slate-600"> · {s.chain.replace(/_/g, " ")}</span>
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-500">
            ~{plan.estimatedWalletSteps} wallet confirmation(s)
            {plan.lifi?.tool ? ` · via ${plan.lifi.tool}` : ""}
          </p>
          {plan.fallbackHint && plan.strategy !== "lifi_one_shot" && (
            <p className="text-xs text-amber-200/80">{plan.fallbackHint}</p>
          )}

          {plan.strategy === "lifi_one_shot" ? (
            <button
              type="button"
              disabled={!isConnected || executing}
              onClick={runIntent}
              className={cn(
                "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold",
                "bg-emerald-600/80 text-white hover:bg-emerald-600 disabled:opacity-50",
              )}
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Execute in one step
            </button>
          ) : (
            <p className="text-xs text-slate-400">
              Use the <strong className="text-slate-300">Exchange</strong> tab below
              for Circle CCTP multi-step flows, or try another pair for LI.FI
              one-shot.
            </p>
          )}
        </div>
      )}

      {message && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-xl px-3 py-2 text-sm",
            status === "error"
              ? "bg-red-500/10 text-red-200"
              : status === "ok"
                ? "bg-emerald-500/10 text-emerald-200"
                : "bg-slate-800/80 text-slate-300",
          )}
        >
          {status === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {message}
        </p>
      )}
    </div>
  );
}
