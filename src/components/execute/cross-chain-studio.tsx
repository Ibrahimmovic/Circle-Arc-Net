"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowLeftRight, Sparkles } from "lucide-react";
import { useNetwork } from "@/providers/network-context";
import { cn } from "@/lib/utils";
import type { ExchangeIntentSnapshot } from "@/lib/exchange-intent";
import { ForgeArbitraryPanel } from "@/components/execute/forge-arbitrary-panel";
import { ForgeRoutesPanel } from "@/components/execute/forge-routes-panel";
import { ForgeRailsStrip } from "@/components/execute/forge-rails-strip";
import { ExchangeWidget } from "@/components/execute/exchange-widget";
import { GlassPanel } from "@/components/ui/glass-ui";
import { figmaEaseOut } from "@/design/motion-presets";

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
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={figmaEaseOut}
      >
        <GlassPanel strong className="execute-desk-hero forge-studio-hero !overflow-visible px-4 py-4 sm:px-5 sm:py-5">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">
          Agora Forge
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              <span className="text-gradient">Execution Desk</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              Swap, bridge, and compare live routes — quote on the left, paths on the right.
            </p>
          </div>
          <ForgeRailsStrip />
        </div>
        </GlassPanel>
      </motion.div>

      <div className="portfolio-glass-tab-bar flex gap-1 overflow-x-auto scrollbar-thin">
        {(
          [
            { id: "swap" as const, label: "Swap & Bridge", icon: ArrowLeftRight },
            { id: "arbitrary" as const, label: "Arbitrary", icon: Sparkles },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "portfolio-glass-tab min-w-0 shrink-0 touch-manipulation sm:px-4",
              tab === id && "portfolio-glass-tab--active",
              id === "arbitrary" && tab === id && "portfolio-glass-tab--amber",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                tab === id ? "text-white" : "text-white/55",
              )}
              strokeWidth={2}
            />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {tab === "arbitrary" ? (
        <GlassPanel strong className="p-4 sm:p-5">
          <ForgeArbitraryPanel />
        </GlassPanel>
      ) : (
        <motion.div
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...figmaEaseOut, delay: 0.08 }}
        >
          <GlassPanel strong className="exchange-widget-premium p-4 sm:p-5">
            <ExchangeWidget
              onIntentChange={setIntent}
              onCctpPending={(p) => setCctpPending(p)}
            />
          </GlassPanel>
          <ForgeRoutesPanel
            intent={intent}
            cctpPending={cctpPending}
            onDismissCctp={() => setCctpPending(null)}
          />
        </motion.div>
      )}

      <nav className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
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
              "portfolio-glass-tab !min-h-[2.5rem] !flex-none !px-4 !py-2",
              utility === id && "portfolio-glass-tab--active",
            )}
          >
            {label}
          </button>
        ))}
      </nav>
      {utility === "send" && (
        <GlassPanel strong className="p-4 sm:p-5">
          <SendPanel />
        </GlassPanel>
      )}
      {utility === "fund" && isTestnet && (
        <GlassPanel strong className="p-4 sm:p-5">
          <FaucetPanel />
        </GlassPanel>
      )}
      {utility === "activity" && (
        <GlassPanel strong className="overflow-hidden p-1">
          <ActivityFeed expanded />
        </GlassPanel>
      )}
    </div>
  );
}
