"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useNetwork } from "@/providers/network-context";
import { cn } from "@/lib/utils";
import type { ExchangeIntentSnapshot } from "@/lib/exchange-intent";
import { ForgeArbitraryPanel } from "@/components/execute/forge-arbitrary-panel";
import { ForgeRoutesPanel } from "@/components/execute/forge-routes-panel";
import { ForgeRailsStrip } from "@/components/execute/forge-rails-strip";
import { ExchangeWidget } from "@/components/execute/exchange-widget";

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

type StudioTab = "swap" | "arbitrary";
type UtilityTab = "send" | "fund" | "activity" | null;

const defaultIntent = (): ExchangeIntentSnapshot => ({
  fromChain: "Arc_Testnet",
  toChain: "Base_Sepolia",
  fromToken: "USDC",
  toToken: "USDC",
  amount: "",
  recipient: "",
});

export function CrossChainStudio() {
  const { isTestnet } = useNetwork();
  const [tab, setTab] = useState<StudioTab>("swap");
  const [utility, setUtility] = useState<UtilityTab>(null);
  const [intent, setIntent] = useState<ExchangeIntentSnapshot>(defaultIntent);
  const [cctpPending, setCctpPending] = useState<{
    burnTx?: string;
    amount: string;
    fromChain: string;
    toChain: string;
  } | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="forge-studio-hero relative px-6 py-7 sm:px-8 sm:py-9">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">
          Agora Forge
        </p>
        <h2 className="relative mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
          <span className="text-gradient">Cross-chain</span> execution
        </h2>
        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Swap, bridge, and full execution in one flow — compare routes on the right,
          quote and exchange on the left. Save custom goals for the agent when you need
          more than a single transaction.
        </p>
        <div className="relative mt-5">
          <ForgeRailsStrip />
        </div>
      </header>

      <div className="flex gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-1">
        {(
          [
            { id: "swap" as const, label: "Swap & Bridge" },
            { id: "arbitrary" as const, label: "Arbitrary" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "forge-mode-tab flex-1",
              tab === id && "forge-mode-tab--active",
              id === "arbitrary" && "forge-mode-tab--arbitrary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "arbitrary" ? (
        <ForgeArbitraryPanel />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-6">
          <div className="forge-panel p-4 sm:p-5">
            <ExchangeWidget
              onIntentChange={setIntent}
              onCctpPending={(p) => setCctpPending(p)}
            />
          </div>
          <ForgeRoutesPanel
            intent={intent}
            cctpPending={cctpPending}
            onDismissCctp={() => setCctpPending(null)}
          />
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
