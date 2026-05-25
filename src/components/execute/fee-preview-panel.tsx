"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { GasPreview } from "@/lib/gas-preview";

function feeSummary(preview: GasPreview): string {
  const platform = preview.lines.find((l) => l.kind === "fee")?.cost ?? "0.01 USDC";
  const gasLines = preview.lines.filter((l) => l.kind === "gas" || l.kind === "protocol");
  if (gasLines.length === 0) return platform;
  return `${platform} + gas/protocol on Arc`;
}

export function FeePreviewPanel({
  preview,
  loading,
  defaultExpanded = false,
}: {
  preview: GasPreview | null;
  loading?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!preview && !loading) return null;

  return (
    <div className="fee-preview-glass mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
      <button
        type="button"
        onClick={() => preview && setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        disabled={!preview}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Fees
        </span>
        {loading && !preview ? (
          <span className="ml-1 text-xs text-slate-500">Calculating…</span>
        ) : preview ? (
          <>
            <span className="min-w-0 flex-1 truncate text-xs text-violet-200/90">
              {feeSummary(preview)}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition ${expanded ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>

      {preview && expanded && (
        <div className="border-t border-white/10 px-3 pb-2.5 pt-1">
          <ul className="space-y-1">
            {preview.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="text-slate-500">{line.label}</span>
                <span
                  className={
                    line.kind === "fee"
                      ? "font-medium text-cyan-200"
                      : "text-slate-300"
                  }
                >
                  {line.cost}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-slate-500">{preview.walletNote}</p>
        </div>
      )}
    </div>
  );
}
