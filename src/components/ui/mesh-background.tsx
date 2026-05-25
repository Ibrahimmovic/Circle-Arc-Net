"use client";

export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-float-slow" />
      <div className="absolute -right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px] animate-float-slow delay-1000" />
      <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/8 blur-[90px] animate-float-slow delay-500" />
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.08) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
