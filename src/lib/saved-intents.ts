export const SAVED_INTENTS_KEY = "agora-forge-signed-intents";

export interface SavedIntent {
  id: string;
  text: string;
  createdAt: string;
  status: "queued" | "running" | "done";
}

export function getSavedIntents(): SavedIntent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_INTENTS_KEY);
    return raw ? (JSON.parse(raw) as SavedIntent[]) : [];
  } catch {
    return [];
  }
}

export function saveIntent(text: string): SavedIntent {
  const entry: SavedIntent = {
    id: `intent-${Date.now()}`,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    status: "queued",
  };
  const prev = getSavedIntents();
  localStorage.setItem(
    SAVED_INTENTS_KEY,
    JSON.stringify([entry, ...prev].slice(0, 20)),
  );
  window.dispatchEvent(new CustomEvent("agora-saved-intents-update"));
  return entry;
}

export function removeIntent(id: string): void {
  const next = getSavedIntents().filter((i) => i.id !== id);
  localStorage.setItem(SAVED_INTENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("agora-saved-intents-update"));
}
