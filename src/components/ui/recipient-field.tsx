"use client";

import { UserPlus } from "lucide-react";

export function RecipientField({
  value,
  onChange,
  label = "Send to friend (optional)",
  placeholder = "0x… wallet address",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="flex items-center gap-2 text-xs uppercase text-slate-400">
        <UserPlus className="h-3.5 w-3.5" />
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-600"
      />
      <p className="mt-1 text-[10px] text-slate-500">
        Leave empty to use your connected wallet on the destination chain.
      </p>
    </label>
  );
}
