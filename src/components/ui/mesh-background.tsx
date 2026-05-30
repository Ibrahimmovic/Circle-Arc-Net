"use client";

/** Animated aurora + perspective grid — site-wide backdrop */
export function MeshBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="mesh-orb mesh-orb--cyan absolute -top-32 left-1/4 h-[28rem] w-[28rem]" />
      <div className="mesh-orb mesh-orb--violet absolute top-1/2 -right-20 h-96 w-96" />
      <div className="mesh-orb mesh-orb--cyan absolute bottom-0 left-1/3 h-72 w-72 opacity-50" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(51,65,85,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.12) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black, transparent)",
        }}
      />
    </div>
  );
}
