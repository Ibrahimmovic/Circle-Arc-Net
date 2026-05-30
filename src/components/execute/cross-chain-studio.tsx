"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { ChevronDown, Repeat2 } from "lucide-react";
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
import { ForgeArbitraryPanel } from "@/components/execute/forge-arbitrary-panel";
import { ForgeExecutionPipeline } from "@/components/execute/forge-execution-pipeline";
import { ForgeRoutePath } from "@/components/execute/forge-route-path";
import { TokenAvatar } from "@/components/execute/token-avatar";
import type { ExecutionKind, ExecutionPipelineStep } from "@/lib/execution/execution-intent-ui";
import { classifyExecution } from "@/lib/execution/execution-intent-ui";
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
type StudioMode = "goal" | "transfer" | "arbitrary";

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
  const [pctActive, setPctActive] = useState<number | null>(null);

  const [routes, setRoutes] = useState<CrossChainRouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [utility, setUtility] = useState<UtilityTab>(null);
  const [studioMode, setStudioMode] = useState<StudioMode>("goal");
  const [intentText, setIntentText] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<ExecutionPipelineStep[]>([]);
  const [executionKind, setExecutionKind] = useState<ExecutionKind>("full");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localKind = classifyExecution(fromChain, toChain, fromToken, toToken);

  const fromTokens = useMemo(
    () => getExecTokens(fromChain, network),
    [fromChain, network],
  );
  const toTokens = useMemo(() => getExecTokens(toChain, network), [toChain, network]);
  const toMeta = findExecToken(toChain, toToken, network);

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
      setIntentText(json.intent ?? null);
      setPipeline(json.pipeline ?? []);
      setExecutionKind(json.executionKind ?? "full");
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
    if (studioMode === "transfer") {
      setToToken(fromToken);
    }
  }, [studioMode, fromToken]);

  useEffect(() => {
    if (studioMode === "goal" && fromToken === toToken && fromChain !== toChain) {
      setToToken("WETH");
    }
  }, [studioMode, fromChain, toChain, fromToken, toToken]);

  const applyMode = (mode: StudioMode) => {
    setStudioMode(mode);
    if (mode === "goal") {
      if (isTestnet) {
        setFromChain("Base_Sepolia");
        setToChain("Ethereum_Sepolia");
        setFromToken("USDC");
        setToToken("WETH");
      } else {
        setFromChain("Base");
        setToChain("Ethereum");
        setFromToken("USDC");
        setToToken("WETH");
      }
    }
    if (mode === "transfer") {
      setToToken(fromToken);
    }
  };

  const execute = async () => {
    if (!address || !selectedRoute?.executable) return;
    setExecuting(true);
    setMessage(null);
    const intent = { fromChain, toChain, fromToken, toToken, amount };
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
        setMessage(`Confirmed · ${tool ?? "route"} · ${txHash.slice(0, 14)}…`);
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
      <header className="forge-studio-hero relative px-6 py-7 sm:px-8 sm:py-9">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">
          Agora Forge
        </p>
        <h2 className="relative mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
          <span className="text-gradient">Cross-chain</span> execution
        </h2>
        <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          State an outcome — we orchestrate debit, routing, conversion, and delivery.
          Not just a bridge form: full execution, stable transfers, or arbitrary calls.
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-1">
        {(
          [
            { id: "goal" as const, label: "Full execution" },
            { id: "transfer" as const, label: "Stable transfer" },
            { id: "arbitrary" as const, label: "Arbitrary" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => applyMode(id)}
            className={cn(
              "forge-mode-tab",
              studioMode === id && "forge-mode-tab--active",
              id === "arbitrary" && "forge-mode-tab--arbitrary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {studioMode === "arbitrary" ? (
        <ForgeArbitraryPanel />
      ) : (
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="forge-panel space-y-4 p-5 sm:p-6">
          {intentText && amount && (
            <div className="forge-intent-banner">
              <p className="forge-intent-banner__label">Execution intent</p>
              <p className="forge-intent-banner__text">{intentText}</p>
            </div>
          )}

          {studioMode === "goal" && localKind === "transfer" && (
            <p className="forge-transfer-notice">
              Same token across chains = stable transfer only. Pick a different{" "}
              <strong className="text-slate-300">receive token</strong> for full execution
              (e.g. USDC → WETH), or switch to Stable transfer mode.
            </p>
          )}

          <h3 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            Spend (source)
          </h3>

          <div className="flex items-center gap-3">
            <TokenAvatar symbol={fromToken} chainKey={fromChain} size={48} />
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">Source chain</span>
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-sm text-white"
                >
                  {chains.map((c) => (
                    <option key={c.appKitChain} value={c.appKitChain}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">Source token</span>
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  {fromTokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label className="block">
            <span className="sr-only">Amount</span>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPctActive(null);
                }}
                className="forge-amount-input w-full rounded-xl py-4 pl-4 pr-16 text-2xl font-semibold text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                {fromToken}
              </span>
            </div>
          </label>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPctActive(p);
                  if (p === 100) setAmount((prev) => prev || "100");
                }}
                className={cn(
                  "forge-chip flex-1 rounded-lg py-2",
                  pctActive === p && "forge-chip--active",
                )}
              >
                {p === 100 ? "MAX" : `${p}%`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={flip}
            className="forge-swap-control"
            aria-label="Swap source and destination"
          >
            <Repeat2 className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className="forge-receive-block flex items-center gap-3 p-3 sm:p-4">
            <TokenAvatar symbol={toToken} chainKey={toChain} size={44} />
            <div className="grid flex-1 gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                Outcome (receive)
              </p>
              <select
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-2 py-2 text-sm text-white"
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
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-2 py-2 text-sm font-semibold text-white"
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
            className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-300"
          >
            <span>Destination wallet (optional)</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", showRecipient && "rotate-180")}
            />
          </button>
          {showRecipient && (
            <RecipientField value={recipient} onChange={setRecipient} />
          )}

          {toChain === "Solana" && !isTestnet && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/90">
              Solana delivery needs a compatible recipient address when the route
              supports it.
            </p>
          )}
        </section>

        <section className="forge-panel forge-panel--routes flex flex-col p-5 sm:p-6">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            Execution plan
          </h3>

          {pipeline.length > 0 && amount && (
            <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
              <ForgeExecutionPipeline steps={pipeline} />
            </div>
          )}

          <p className="mt-4 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            Solver paths
            {executionKind === "full" && " · bundled cross-chain"}
          </p>

          <ForgeRoutePath
            className="mt-3"
            fromLabel={fromLabel}
            toLabel={toLabel}
            loading={quoteLoading}
          />

          {quoteLoading && (
            <div className="forge-scan-bar mt-3" aria-hidden>
              <div className="forge-scan-bar__fill" />
            </div>
          )}

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto min-h-[12rem]">
            {!isConnected && (
              <p className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 px-4 py-8 text-center text-sm text-cyan-100/90">
                Connect your wallet to scan routes
              </p>
            )}
            {isConnected && !amount && (
              <p className="py-10 text-center text-sm text-slate-500">
                Enter an amount to compare paths
              </p>
            )}
            {isConnected && amount && !quoteLoading && routes.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No path found — try USDC → WETH between Base and Ethereum
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
            className="forge-execute-btn mt-5"
          >
            {executing
              ? "Confirm in wallet…"
              : executionKind === "full"
                ? "Run execution"
                : "Run transfer"}
          </button>

          {message && (
            <p
              role="status"
              className={cn(
                "mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed",
                status === "error"
                  ? "border border-red-500/30 bg-red-950/40 text-red-200"
                  : status === "ok"
                    ? "border border-emerald-500/25 bg-emerald-950/30 text-emerald-200"
                    : "border border-slate-700/60 bg-slate-900/80 text-slate-300",
              )}
            >
              {message}
            </p>
          )}
        </section>
      </div>
      )}

      <nav className="flex flex-wrap gap-2 border-t border-slate-800/60 pt-5">
        {(
          [
            { id: "send" as const, label: "Send" },
            { id: "fund" as const, label: "Fund wallet" },
            { id: "activity" as const, label: "History" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setUtility(utility === id ? null : id)}
            className={cn(
              "forge-utility-pill",
              utility === id && "forge-utility-pill--on",
            )}
          >
            {label}
          </button>
        ))}
      </nav>
      {utility === "send" && <SendPanel />}
      {utility === "fund" && isTestnet && <FaucetPanel />}
      {utility === "activity" && <ActivityFeed expanded />}
    </div>
  );
}
