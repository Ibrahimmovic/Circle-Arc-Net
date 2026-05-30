/**
 * Theme 1 — Cinematic glassmorphism (site backdrop, panels, typography shells)
 * Theme 2 — Liquid glass (buttons, icons, interactive controls)
 */
export const cinematicTheme = {
  sky: {
    top: "#070a12",
    mid: "#14101c",
    horizon: "#2a1a24",
    floor: "#0c0a10",
  },
  cloud: {
    coral: "rgba(255, 127, 80, 0.38)",
    amber: "rgba(255, 160, 90, 0.28)",
    slate: "rgba(120, 130, 160, 0.22)",
    violet: "rgba(120, 90, 180, 0.18)",
  },
  glass: {
    fill: "rgba(255, 255, 255, 0.07)",
    fillStrong: "rgba(255, 255, 255, 0.11)",
    border: "rgba(255, 255, 255, 0.16)",
    highlight: "rgba(255, 255, 255, 0.22)",
    blur: "28px",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.72)",
    muted: "rgba(255, 255, 255, 0.45)",
  },
} as const;

export const liquidGlassTheme = {
  pill: {
    radius: "9999px",
    blur: "16px",
  },
  gradients: {
    primary: "linear-gradient(135deg, rgba(139, 92, 246, 0.65) 0%, rgba(255, 127, 80, 0.55) 100%)",
    secondary: "linear-gradient(135deg, rgba(34, 211, 238, 0.35) 0%, rgba(99, 102, 241, 0.45) 100%)",
    iconCore: "linear-gradient(145deg, rgba(56, 189, 248, 0.5) 0%, rgba(139, 92, 246, 0.55) 100%)",
    track: "linear-gradient(90deg, rgba(99, 102, 241, 0.5), rgba(236, 72, 153, 0.45))",
  },
  shadow: {
    causticCyan: "0 12px 40px rgba(34, 211, 238, 0.22)",
    causticViolet: "0 12px 40px rgba(139, 92, 246, 0.25)",
    causticCoral: "0 12px 40px rgba(255, 127, 80, 0.2)",
    inset: "inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(255, 255, 255, 0.06)",
  },
} as const;
