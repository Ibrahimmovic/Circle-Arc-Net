export interface TxRecord {
  id: string;
  type: "bridge" | "swap" | "faucet";
  status: "pending" | "success" | "error";
  summary: string;
  feeUsd?: string;
  chain?: string;
  timestamp: number;
  hash?: string;
}

const KEY = "agora-forge-tx-log";

export function getTxLog(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

export function pushTx(record: Omit<TxRecord, "id" | "timestamp">) {
  const entry: TxRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const log = [entry, ...getTxLog()].slice(0, 30);
  localStorage.setItem(KEY, JSON.stringify(log));
  window.dispatchEvent(new CustomEvent("agora-tx-update"));
  return entry;
}
