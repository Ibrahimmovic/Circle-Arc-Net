"use client";

export type WalletStepState = "pending" | "active" | "done" | "skipped";

export type WalletStep = {
  id: string;
  title: string;
  subtitle?: string;
  state: WalletStepState;
};

export function WalletStepsProgress({ steps }: { steps: WalletStep[] }) {
  if (!steps.length) return null;

  return (
    <div className="mt-3 flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 backdrop-blur-sm">
      {steps.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-1">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                s.state === "done"
                  ? "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40"
                  : s.state === "active"
                    ? "bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/60 animate-pulse"
                    : s.state === "skipped"
                      ? "bg-slate-700/50 text-slate-500"
                      : "bg-slate-800/80 text-slate-500 ring-1 ring-slate-600"
              }`}
            >
              {s.state === "done" ? "✓" : i + 1}
            </div>
            <p className="max-w-[56px] truncate text-center text-[8px] font-medium text-slate-300 sm:max-w-[72px] sm:text-[9px]">
              {s.title}
            </p>
            {s.subtitle && (
              <p className="max-w-[80px] text-center text-[8px] text-slate-500">
                {s.subtitle}
              </p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mb-4 h-px flex-1 ${
                s.state === "done" ? "bg-emerald-500/40" : "bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
