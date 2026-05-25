/** Circle bridge returns state strings like "error" even when burn succeeded — normalize for UI. */

const SUCCESS_STATES = new Set([
  "success",
  "completed",
  "complete",
  "pending",
  "submitted",
  "in_progress",
  "in progress",
  "processing",
]);

const FAILURE_STATES = new Set(["error", "failed", "reverted", "cancelled"]);

export function bridgeSubmitStatus(state: string | undefined): {
  uiStatus: "success" | "error";
  label: string;
} {
  const raw = (state ?? "submitted").toLowerCase().trim();

  if (FAILURE_STATES.has(raw)) {
    return {
      uiStatus: "error",
      label:
        "Bridge may have failed — check Arcscan. If burn succeeded, USDC will arrive on destination in ~15 min (SLOW CCTP).",
    };
  }

  if (raw === "pending" || SUCCESS_STATES.has(raw) || !raw) {
    return {
      uiStatus: "success",
      label:
        "Bridge submitted — USDC mints on destination in ~15 min (SLOW CCTP). Track burn on source explorer.",
    };
  }

  return {
    uiStatus: "success",
    label: `Bridge status: ${state}`,
  };
}
