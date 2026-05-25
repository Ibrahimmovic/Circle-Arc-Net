"use client";

import { Info } from "lucide-react";

export function FeeHint({
  summary,
  lines,
}: {
  summary: string;
  lines?: string[];
}) {
  return (
    <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-950/30 p-4 text-sm text-cyan-50">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        <div className="space-y-2">
          <p className="font-medium text-cyan-100">{summary}</p>
          {lines?.map((line) => (
            <p key={line} className="text-xs text-slate-300">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
