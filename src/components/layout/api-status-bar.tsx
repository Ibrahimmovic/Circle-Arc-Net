"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ServiceStatus = Record<string, boolean | string | undefined>;

export function ApiStatusBar({ variant = "default" }: { variant?: "default" | "minimal" }) {
  const [services, setServices] = useState<ServiceStatus | null>(null);

  useEffect(() => {
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setServices(d.services))
      .catch(() => setServices(null));
  }, []);

  if (!services) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking APIs…
      </div>
    );
  }

  const covalentOk = Boolean(services.covalent ?? services.goldrush);
  const items = [
    ["Circle", services.circle],
    ["Kit", services.kit],
    ["Zerion", services.zerion],
    ["Covalent", covalentOk],
    ["Alchemy", services.alchemy],
  ] as const;

  const allOk = items.every(([, ok]) => ok);

  if (variant === "minimal") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
        {items.map(([name, ok]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span
              className={`h-1 w-1 rounded-full ${ok ? "bg-emerald-500/80" : "bg-rose-500/80"}`}
            />
            {name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-full border px-4 py-1.5 text-xs ${
        allOk
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
      }`}
    >
      {items.map(([name, ok]) => (
        <span key={name} className="flex items-center gap-1">
          {ok ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          ) : (
            <XCircle className="h-3 w-3 text-rose-400" />
          )}
          {name}
        </span>
      ))}
    </div>
  );
}
