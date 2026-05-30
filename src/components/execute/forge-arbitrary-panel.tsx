"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/providers/network-context";
import { getExecChains } from "@/lib/execution/chain-catalog";
import { executeArbitraryCall } from "@/lib/execution/execute-arbitrary";
import { cn } from "@/lib/utils";

export function ForgeArbitraryPanel() {
  const { address, isConnected } = useAccount();
  const { network, isTestnet } = useNetwork();
  const chains = getExecChains(network);

  const [chain, setChain] = useState(chains[0]?.appKitChain ?? "Base_Sepolia");
  const [contract, setContract] = useState("");
  const [calldata, setCalldata] = useState("0x");
  const [valueEth, setValueEth] = useState("");
  const [signedIntent, setSignedIntent] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [running, setRunning] = useState(false);

  const runCalldata = async () => {
    if (!address) return;
    setRunning(true);
    setMsg(null);
    try {
      const { txHash } = await executeArbitraryCall(
        {
          chain,
          to: contract,
          data: calldata,
          valueEth: valueEth || undefined,
          mode: network,
          fromAddress: address,
          testnet: isTestnet,
        },
        setMsg,
      );
      setMsg(`Arbitrary call sent · ${txHash.slice(0, 16)}…`);
      setStatus("ok");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
      setStatus("error");
    } finally {
      setRunning(false);
    }
  };

  const queueIntent = () => {
    if (!signedIntent.trim()) {
      setMsg("Describe your execution goal first.");
      setStatus("error");
      return;
    }
    try {
      const key = "agora-forge-signed-intents";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      const entry = {
        id: `intent-${Date.now()}`,
        text: signedIntent.trim(),
        chain,
        createdAt: new Date().toISOString(),
        status: "queued",
      };
      localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 20)));
      setMsg("Intent queued for agent / solver (stored locally). Calldata rail runs below when you have hex.");
      setStatus("ok");
    } catch {
      setMsg("Could not save intent.");
      setStatus("error");
    }
  };

  return (
    <div className="forge-panel space-y-5 border border-amber-500/20 p-5 sm:p-6">
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-amber-400/90">
          Arbitrary execution
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Not a swap: run custom contract calls or queue a signed goal for the agent.
          Use only contracts you trust.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold text-slate-500">Signed intent (goal text)</span>
        <textarea
          value={signedIntent}
          onChange={(e) => setSignedIntent(e.target.value)}
          rows={3}
          placeholder="e.g. Stake 50 USDC into vault X on Arbitrum after bridging from Base"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
        />
        <button
          type="button"
          disabled={!isConnected}
          onClick={queueIntent}
          className="forge-chip rounded-lg px-4 py-2 text-xs"
        >
          Queue intent for agent
        </button>
      </label>

      <div className="border-t border-slate-800 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Generic calldata (live on EVM)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">Chain</span>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {chains.map((c) => (
                <option key={c.appKitChain} value={c.appKitChain}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">Contract (to)</span>
            <input
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="0x…"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">Calldata</span>
            <input
              value={calldata}
              onChange={(e) => setCalldata(e.target.value)}
              placeholder="0x"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Value (ETH, optional)</span>
            <input
              value={valueEth}
              onChange={(e) => setValueEth(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!isConnected || running}
          onClick={runCalldata}
          className="mt-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-bold text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
        >
          {running ? "Waiting for wallet…" : "Execute arbitrary call"}
        </button>
      </div>

      {msg && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-xs",
            status === "error" ? "bg-red-950/40 text-red-200" : "bg-slate-800 text-slate-300",
          )}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
