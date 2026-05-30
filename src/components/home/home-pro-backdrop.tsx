"use client";

import { HomeHeroAtmosphere } from "./home-hero-atmosphere";

/** Institutional backdrop — grid, grain, subtle particle field. */
export function HomeProBackdrop() {
  return (
    <div className="home-pro-backdrop" aria-hidden>
      <HomeHeroAtmosphere />
      <div className="home-pro-backdrop__grid" />
      <div className="home-pro-backdrop__vignette" />
      <div className="home-pro-backdrop__horizon" />
      <div className="home-pro-backdrop__grain" />
    </div>
  );
}
