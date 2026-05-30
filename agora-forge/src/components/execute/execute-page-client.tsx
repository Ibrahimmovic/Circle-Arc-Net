"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BridgePanel } from "@/components/execute/bridge-panel";
import { SwapPanel } from "@/components/execute/swap-panel";
import { ExecutionEnginePanel } from "@/components/execute/execution-engine-panel";
import { ExecutionRunnerPanel } from "@/components/execute/execution-runner-panel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "engine", label: "Engine" },
  { id: "queue", label: "Queue" },
  { id: "bridge", label: "CCTP Bridge" },
  { id: "swap", label: "Swap" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ExecutePageClient() {
  const [tab, setTab] = useState<TabId>("engine");
  const [bridgePrefill, setBridgePrefill] = useState<{
    from: string;
    to: string;
  } | null>(null);

  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Full stack: plan → queue → CCTP · swap · arb · LiFi"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="glass-panel rounded-2xl p-5 text-sm text-slate-400">
          <p>
            <strong className="text-white">Cross-chain execution</strong> is not
            only a bridge form. The{" "}
            <strong className="text-cyan-300">engine</strong> detects rebalance
            + arb, the <strong className="text-violet-300">queue</strong> compiles
            multi-step jobs, and{" "}
            <strong className="text-emerald-300">Circle App Kit</strong> executes
            CCTP + swaps onchain.
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "min-h-[40px] shrink-0 rounded-xl px-4 py-2 text-xs font-semibold",
                tab === id
                  ? "bg-violet-600/40 text-white ring-1 ring-violet-400/30"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "engine" && (
          <ExecutionEnginePanel
            onPrefillBridge={(from, to) => {
              setBridgePrefill({ from, to });
              setTab("bridge");
            }}
            onOpenQueue={() => setTab("queue")}
          />
        )}

        {tab === "queue" && <ExecutionRunnerPanel />}

        {tab === "bridge" && (
          <div id="cctp-execute">
            <BridgePanel
              key={`${bridgePrefill?.from}-${bridgePrefill?.to}`}
              prefillFrom={bridgePrefill?.from}
              prefillTo={bridgePrefill?.to}
            />
          </div>
        )}

        {tab === "swap" && <SwapPanel />}
      </div>
    </AppShell>
  );
}
