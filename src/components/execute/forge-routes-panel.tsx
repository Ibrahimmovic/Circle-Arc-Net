"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/providers/network-context";
import type { ExchangeIntentSnapshot } from "@/lib/exchange-intent";
import { findExecToken } from "@/lib/execution/chain-catalog";
import type { CrossChainRouteOption } from "@/lib/lifi-routes";
import { CrossChainRouteCard } from "@/components/execute/cross-chain-route-card";
import { ForgeExecutionPipeline } from "@/components/execute/forge-execution-pipeline";
import { ForgeRoutePath } from "@/components/execute/forge-route-path";
import { ForgeCctpPending } from "@/components/execute/forge-cctp-pending";
import { ExecuteRouteStrip } from "@/components/execute/execute-route-strip";
import { GlassPanel } from "@/components/ui/glass-ui";
import type { ExecutionKind, ExecutionPipelineStep } from "@/lib/execution/execution-intent-ui";
import { classifyExecution } from "@/lib/execution/execution-intent-ui";
import { getExecChains } from "@/lib/execution/chain-catalog";

export function ForgeRoutesPanel({
  intent,
  cctpPending,
  onDismissCctp,
}: {
  intent: ExchangeIntentSnapshot;
  cctpPending?: { burnTx?: string; amount: string; fromChain: string; toChain: string } | null;
  onDismissCctp?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { network } = useNetwork();
  const chains = getExecChains(network);

  const [routes, setRoutes] = useState<CrossChainRouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [intentText, setIntentText] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<ExecutionPipelineStep[]>([]);
  const [executionKind, setExecutionKind] = useState<ExecutionKind>("full");
  const [cctpNote, setCctpNote] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toMeta = findExecToken(intent.toChain, intent.toToken, network);
  const fromLabel = chains.find((c) => c.appKitChain === intent.fromChain)?.label ?? intent.fromChain;
  const toLabel = chains.find((c) => c.appKitChain === intent.toChain)?.label ?? intent.toChain;
  const kind = classifyExecution(
    intent.fromChain,
    intent.toChain,
    intent.fromToken,
    intent.toToken,
  );

  const fetchRoutes = useCallback(async () => {
    if (!address || !intent.amount || Number(intent.amount) <= 0) {
      setRoutes([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/execute/routes?network=${network}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...intent,
          fromAddress: address,
          toAddress: intent.recipient.trim() || address,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Routes unavailable");
      const list = (json.routes ?? []) as CrossChainRouteOption[];
      setRoutes(list);
      const circle = list.find((r) => r.circleDirect);
      if (json.executionKind === "transfer" && circle) setSelectedId(circle.id);
      else setSelectedId(list.find((r) => r.executable)?.id ?? list[0]?.id ?? null);
      setIntentText(json.intent ?? null);
      setPipeline(json.pipeline ?? []);
      setExecutionKind(json.executionKind ?? "full");
      setCctpNote(json.cctpNote ?? null);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [address, intent, network]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchRoutes(), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRoutes]);

  const selected = routes.find((r) => r.id === selectedId);

  const hasAmount = Boolean(intent.amount && Number(intent.amount) > 0);
  const showIdleStrip = isConnected && (!intent.amount || (hasAmount && routes.length === 0 && !loading));

  return (
    <GlassPanel strong className="exec-visual--glass forge-panel forge-panel--routes flex min-w-0 flex-col overflow-hidden p-0 xl:max-h-[22rem]">
      <div className="exec-visual__chrome shrink-0">
        <div className="exec-visual__chrome-left">
          <span className="exec-visual__dot exec-visual__dot--live" />
          <span className="exec-visual__title">Routes &amp; plan</span>
        </div>
        <span className="exec-visual__tag">Multichain · live quotes</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
      <p className="shrink-0 text-xs text-white/55">
        Compare paths — confirm with <strong className="text-white/75">Quote</strong> and{" "}
        <strong className="text-white/75">Exchange</strong> on the left.
      </p>

      {intentText && hasAmount && (
        <div className="forge-intent-banner mt-2 shrink-0">
          <p className="forge-intent-banner__label">Your move</p>
          <p className="forge-intent-banner__text text-sm">{intentText}</p>
        </div>
      )}

      {kind === "full" && intent.fromToken === intent.toToken && intent.fromChain !== intent.toChain && hasAmount && (
        <p className="forge-transfer-notice mt-2 shrink-0 text-xs">
          Same token across chains = stable transfer. Circle route below is recommended.
        </p>
      )}

      {pipeline.length > 0 && hasAmount && (
        <div className="mt-2 shrink-0 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
          <ForgeExecutionPipeline steps={pipeline} />
        </div>
      )}

      {hasAmount && (
        <>
          <ForgeRoutePath
            className="mt-2 shrink-0"
            fromLabel={fromLabel}
            toLabel={toLabel}
            loading={loading}
          />
          {loading && (
            <div className="forge-scan-bar mt-2 shrink-0" aria-hidden>
              <div className="forge-scan-bar__fill" />
            </div>
          )}
        </>
      )}

      {cctpNote && (
        <p className="mt-2 shrink-0 text-xs text-amber-200/90">{cctpNote}</p>
      )}

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {!isConnected && (
          <p className="py-4 text-center text-sm text-white/50">Connect wallet for routes</p>
        )}
        {showIdleStrip && (
          <ExecuteRouteStrip
            fromChain={intent.fromChain}
            toChain={intent.toChain}
            fromToken={intent.fromToken}
            toToken={intent.toToken}
          />
        )}
        {routes.map((r) => (
          <CrossChainRouteCard
            key={r.id}
            route={r}
            toSymbol={intent.toToken}
            toDecimals={toMeta?.decimals ?? 18}
            selected={selectedId === r.id}
            onSelect={() => setSelectedId(r.id)}
          />
        ))}
      </div>

      {selected?.circleDirect && (
        <p className="mt-2 text-xs text-cyan-200/80">
          Selected: Circle CCTP — use Exchange on the left (includes approve + burn steps).
        </p>
      )}

      {cctpPending && address && (
        <div className="mt-3">
          <ForgeCctpPending
            amount={cctpPending.amount}
            fromChain={cctpPending.fromChain}
            fromLabel={fromLabel}
            toLabel={toLabel}
            toChain={cctpPending.toChain}
            toToken={intent.toToken}
            burnTx={cctpPending.burnTx}
            address={address}
            network={network}
            onDismiss={onDismissCctp}
          />
        </div>
      )}
      </div>
    </GlassPanel>
  );
}
