"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#020617] px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-slate-400">
        {error.message || "The app hit an error while loading."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950"
      >
        Reload app
      </button>
    </div>
  );
}
