"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useNetwork } from "@/providers/network-context";
import { getExecChains } from "@/lib/execution/chain-catalog";
import { executeArbitraryCall } from "@/lib/execution/execute-arbitrary";
import { cn } from "@/lib/utils";

const GOAL_PRESETS = [
  {
    id: "stake",
    label: "Stake after bridging",
    text: "Bridge USDC from Base to Arbitrum, then stake in a vault I specify later.",
  },
  {
    id: "rebalance",
    label: "Rebalance my portfolio",
    text: "Move 30% of my USDC from Ethereum to Base and keep the rest on Ethereum.",
  },
  {
    id: "pay",
    label: "Pay someone on another chain",
    text: "Send 100 USDC to a recipient wallet on Polygon.",
  },
] as const;

export function ForgeArbitraryPanel() {
  const { address, isConnected } = useAccount();
  const { network, isTestnet } = useNetwork();
  const chains = getExecChains(network);

  const [goal, setGoal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chain, setChain] = useState(chains[0]?.appKitChain ?? "Base_Sepolia");
  const [contract, setContract] = useState("");
  const [calldata, setCalldata] = useState("0x");
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [running, setRunning] = useState(false);

  const queueGoal = () => {
    if (!goal.trim()) {
      setMsg("Pick a preset or describe your goal in plain English.");
      setStatus("error");
      return;
    }
    try {
      const key = "agora-forge-signed-intents";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      localStorage.setItem(
        key,
        JSON.stringify(
          [
            {
              id: `intent-${Date.now()}`,
              text: goal.trim(),
              createdAt: new Date().toISOString(),
              status: "queued",
            },
            ...prev,
          ].slice(0, 20),
        ),
      );
      setMsg("Goal saved. Open the Agent page to run portfolio-linked execution when ready.");
      setStatus("ok");
    } catch {
      setMsg("Could not save goal.");
      setStatus("error");
    }
  };

  const runAdvanced = async () => {
    if (!address) return;
    setRunning(true);
    try {
      const { txHash } = await executeArbitraryCall(
        {
          chain,
          to: contract,
          data: calldata,
          mode: network,
          fromAddress: address,
          testnet: isTestnet,
        },
        setMsg,
      );
      setMsg(`Contract call sent · ${txHash.slice(0, 14)}…`);
      setStatus("ok");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
      setStatus("error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="forge-panel p-5 sm:p-6">
        <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-violet-300/90">
          Custom goal
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Describe what you want in normal language. For swaps and bridges, use{" "}
          <strong className="text-slate-200">Full execution</strong> or{" "}
          <strong className="text-slate-200">Stable transfer</strong> — they work
          today with your wallet.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GOAL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setGoal(p.text)}
              className="forge-chip rounded-lg px-3 py-2 text-left text-xs"
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={4}
          placeholder="What should happen across chains?"
          className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
        />

        <button
          type="button"
          disabled={!isConnected}
          onClick={queueGoal}
          className="forge-execute-btn mt-4"
        >
          Save goal for agent
        </button>
      </div>

      <div className="forge-panel border border-slate-700/60 p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-400"
        >
          Developer: custom contract call
          <span className="text-xs">{showAdvanced ? "Hide" : "Show"}</span>
        </button>
        {showAdvanced && (
          <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500">
              Only for developers. Wrong calldata can lose funds.
            </p>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {chains.map((c) => (
                <option key={c.appKitChain} value={c.appKitChain}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="Contract address 0x…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
            />
            <input
              value={calldata}
              onChange={(e) => setCalldata(e.target.value)}
              placeholder="Calldata 0x…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
            />
            <button
              type="button"
              disabled={!isConnected || running}
              onClick={runAdvanced}
              className="w-full rounded-xl border border-slate-600 py-2.5 text-sm font-semibold text-slate-300"
            >
              {running ? "Wallet…" : "Send contract call"}
            </button>
          </div>
        )}
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
