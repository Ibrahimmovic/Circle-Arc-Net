"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Target, Trash2 } from "lucide-react";
import {
  getSavedIntents,
  removeIntent,
  type SavedIntent,
} from "@/lib/saved-intents";

export function SavedGoalsPanel() {
  const [goals, setGoals] = useState<SavedIntent[]>([]);

  const refresh = useCallback(() => {
    setGoals(getSavedIntents());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("agora-saved-intents-update", onUpdate);
    return () => window.removeEventListener("agora-saved-intents-update", onUpdate);
  }, [refresh]);

  return (
    <section
      id="saved-goals"
      className="luxury-card scroll-mt-24 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <Target className="mt-0.5 h-8 w-8 shrink-0 text-violet-300" />
        <div>
          <h3 className="text-lg font-bold text-white">Saved goals</h3>
          <p className="mt-1 text-sm text-slate-400">
            Goals you save on Execute → Arbitrary are stored in this browser (
            <code className="text-xs text-slate-500">localStorage</code>). The agent
            can use them as intent notes alongside portfolio-driven CCTP jobs.
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-700/80 px-4 py-8 text-center text-sm text-slate-500">
          No saved goals yet.{" "}
          <Link href="/execute" className="text-cyan-400 hover:underline">
            Open Execute
          </Link>
          , pick Arbitrary, and click Save goal for agent.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {goals.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-slate-200">{g.text}</p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {new Date(g.createdAt).toLocaleString()} · {g.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeIntent(g.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-300"
                  aria-label="Remove goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
