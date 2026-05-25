"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#020617", color: "#e2e8f0", fontFamily: "system-ui" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24 }}>Agora Forge</h1>
          <p style={{ color: "#94a3b8", marginTop: 12 }}>{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 24, padding: "12px 24px", background: "#22d3ee", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
