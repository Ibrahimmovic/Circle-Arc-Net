"use client";

import { useEffect, useState } from "react";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { ExchangeWidget } from "./exchange-widget";
import { SendPanel } from "./send-panel";
import { FaucetPanel } from "./faucet-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { cn } from "@/lib/utils";
import { Zap, Send, Droplets, History } from "lucide-react";

const TABS = [
  { id: "exchange", label: "Exchange", icon: Zap },
  { id: "send", label: "Send", icon: Send },
  { id: "fund", label: "Fund", icon: Droplets },
  { id: "activity", label: "Activity", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ExecuteHub() {
  const [tab, setTab] = useState<TabId>("exchange");

  useEffect(() => {
    installCircleProxyFetch();
  }, []);

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 sm:space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1 scrollbar-thin [-webkit-overflow-scrolling:touch]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all touch-manipulation sm:flex-1",
              tab === id
                ? "bg-violet-600/40 text-white ring-1 ring-violet-400/30"
                : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {tab === "exchange" && <ExchangeWidget />}
      {tab === "send" && <SendPanel />}
      {tab === "fund" && <FaucetPanel />}
      {tab === "activity" && <ActivityFeed expanded />}
    </div>
  );
}
