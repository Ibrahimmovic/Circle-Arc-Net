"use client";

import { useEffect, useState } from "react";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { BridgePanel } from "./bridge-panel";
import { SwapPanel } from "./swap-panel";
import { FaucetPanel } from "./faucet-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, Repeat, Droplets, History } from "lucide-react";

const TABS = [
  { id: "bridge", label: "Bridge", icon: ArrowRightLeft },
  { id: "swap", label: "Swap", icon: Repeat },
  { id: "fund", label: "Fund", icon: Droplets },
  { id: "activity", label: "Activity", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ExecuteHub() {
  const [tab, setTab] = useState<TabId>("bridge");

  useEffect(() => {
    installCircleProxyFetch();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
              tab === id
                ? "bg-gradient-to-r from-cyan-500/25 to-violet-500/25 text-white shadow-[0_0_20px_rgba(34,211,238,0.2)] ring-1 ring-cyan-500/30"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "bridge" && <BridgePanel />}
      {tab === "swap" && <SwapPanel />}
      {tab === "fund" && <FaucetPanel />}
      {tab === "activity" && <ActivityFeed expanded />}
    </div>
  );
}
