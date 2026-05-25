"use client";

import type { GasPreview } from "@/lib/gas-preview";

export function FeePreviewPanel({
  preview,
  loading,
}: {
  preview: GasPreview | null;
  loading?: boolean;
}) {
  if (!preview && !loading) return null;

  return (
    <div className="fee-preview-glass mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Estimated fees
      </p>

      {loading && !preview && (
        <p className="mt-2 text-xs text-slate-500">Calculating gas…</p>
      )}

      {preview && (
        <>
          <ul className="mt-2 space-y-1.5">
            {preview.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-400">{line.label}</span>
                <span
                  className={
                    line.kind === "fee"
                      ? "font-medium text-cyan-200"
                      : "text-slate-200"
                  }
                >
                  {line.cost}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-violet-200/90">
            {preview.totalGasHint}
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            {preview.walletNote}
          </p>
        </>
      )}
    </div>
  );
}
