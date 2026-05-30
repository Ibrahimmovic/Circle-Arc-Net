"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BridgePanel } from "@/components/execute/bridge-panel";
import { ExecutionEnginePanel } from "@/components/execute/execution-engine-panel";

export function ExecutePageClient() {
  const [bridgePrefill, setBridgePrefill] = useState<{
    from: string;
    to: string;
  } | null>(null);

  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Execution engine · CCTP bridge · swap · arb signals (RFB #05) · intents roadmap"
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="glass-panel rounded-2xl p-6 text-sm leading-relaxed text-slate-400">
          <p>
            <strong className="text-cyan-300">Bridge + swap</strong> are the{" "}
            <em>live</em> Circle rails. The{" "}
            <strong className="text-violet-300">execution engine</strong> above
            them plans rebalance, arbitrage, and future intent/calldata routes —
            so cross-chain execution is bigger than a single widget.
          </p>
        </div>

        <ExecutionEnginePanel
          onPrefillBridge={(from, to) => setBridgePrefill({ from, to })}
        />

        <div id="cctp-execute">
          <BridgePanel
            key={`${bridgePrefill?.from ?? ""}-${bridgePrefill?.to ?? ""}`}
            prefillFrom={bridgePrefill?.from}
            prefillTo={bridgePrefill?.to}
          />
        </div>
      </div>
    </AppShell>
  );
}
