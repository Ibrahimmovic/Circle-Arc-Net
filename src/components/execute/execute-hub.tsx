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
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex justify-center gap-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              tab === id
                ? "bg-violet-600/40 text-white ring-1 ring-violet-400/30"
                : "text-slate-400 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
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
