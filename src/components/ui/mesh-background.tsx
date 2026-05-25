"use client";

/** Subtle accents only — no heavy blur that dims the UI */
export function MeshBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-40"
      aria-hidden
    >
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-600/20 blur-3xl" />
      <div className="absolute top-1/2 right-0 h-80 w-80 rounded-full bg-violet-700/15 blur-3xl" />
    </div>
  );
}
