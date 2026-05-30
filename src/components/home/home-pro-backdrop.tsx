"use client";

/** Minimal institutional backdrop — grain + horizon line only. */
export function HomeProBackdrop() {
  return (
    <div className="home-pro-backdrop" aria-hidden>
      <div className="home-pro-backdrop__grid" />
      <div className="home-pro-backdrop__horizon" />
      <div className="home-pro-backdrop__grain" />
    </div>
  );
}
