/**
 * Figma-aligned design tokens (Variables collection: Agora Forge / Production).
 * Mirror these in Figma: Local variables → sync names with this file for handoff.
 */
export const figmaTokens = {
  color: {
    bg: {
      canvas: "#000000",
      elevated: "#05020f",
      glass: "rgba(8, 4, 20, 0.72)",
    },
    accent: {
      indigo: "#6366f1",
      indigoLight: "#818cf8",
      cyan: "#22d3ee",
      violet: "#a78bfa",
      emerald: "#34d399",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(148, 163, 184, 0.95)",
      muted: "#64748b",
    },
    border: {
      subtle: "rgba(99, 102, 241, 0.15)",
      glow: "rgba(129, 140, 248, 0.35)",
    },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    pill: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    hero: 64,
  },
  typography: {
    hero: { size: "clamp(2.25rem, 7vw, 4.75rem)", weight: 800, tracking: "-0.03em" },
    h2: { size: "1.5rem", weight: 700 },
    body: { size: "0.9375rem", lineHeight: 1.65 },
    label: { size: "0.625rem", weight: 700, tracking: "0.16em" },
  },
  shadow: {
    glowIndigo: "0 0 56px rgba(99, 102, 241, 0.35)",
    glowCyan: "0 0 40px rgba(34, 211, 238, 0.28)",
    panel: "0 24px 64px rgba(0, 0, 0, 0.55)",
  },
  blur: {
    glass: 20,
    heavy: 40,
  },
} as const;

/** CSS custom properties injected on :root — keep in sync with Figma variables panel */
export function figmaTokenCssVars(): Record<string, string> {
  const t = figmaTokens;
  return {
    "--figma-bg-canvas": t.color.bg.canvas,
    "--figma-bg-elevated": t.color.bg.elevated,
    "--figma-bg-glass": t.color.bg.glass,
    "--figma-accent-indigo": t.color.accent.indigo,
    "--figma-accent-indigo-light": t.color.accent.indigoLight,
    "--figma-accent-cyan": t.color.accent.cyan,
    "--figma-accent-violet": t.color.accent.violet,
    "--figma-text-primary": t.color.text.primary,
    "--figma-text-secondary": t.color.text.secondary,
    "--figma-border-subtle": t.color.border.subtle,
    "--figma-radius-lg": `${t.radius.lg}px`,
    "--figma-radius-xl": `${t.radius.xl}px`,
    "--figma-shadow-glow": t.shadow.glowIndigo,
    "--figma-blur-glass": `${t.blur.glass}px`,
  };
}
