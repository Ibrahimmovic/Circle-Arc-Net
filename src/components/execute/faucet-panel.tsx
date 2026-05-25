"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Droplets, Loader2, ExternalLink } from "lucide-react";
import { getBridgeChains } from "@/lib/network";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import type { CircleFaucetBlockchain } from "@/lib/circle";

export function FaucetPanel() {
  const { address, isConnected } = useAccount();
  const { network } = useNetwork();
  const chains = getBridgeChains(network).filter((c) => c.circleFaucet);
  const arcFaucet =
    chains.find((c) => c.isArc)?.circleFaucet ?? chains[0]?.circleFaucet;
  const [blockchain, setBlockchain] = useState<CircleFaucetBlockchain>(
    (arcFaucet as CircleFaucetBlockchain) ?? "ARC-TESTNET",
  );
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function requestFunds() {
    if (!address) {
      setMessage("Connect wallet first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/circle/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, blockchain }),
      });
      const data = await res.json();
      if (data.ok) {
        pushTx({
          type: "faucet",
          status: "success",
          summary: `Circle faucet · ${blockchain}`,
          chain: blockchain,
          feeUsd: "0",
        });
        setStatus("done");
        setMessage(data.message);
      } else {
        pushTx({
          type: "faucet",
          status: "error",
          summary: `Faucet: ${data.message?.slice(0, 80)}`,
        });
        setStatus("error");
        setMessage(
          data.message +
            " — Or use https://faucet.circle.com manually.",
        );
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Faucet failed");
    }
  }

  const isTestnet = network === "testnet";

  return (
    <div className="glass-panel rounded-2xl p-6 border border-amber-500/25 bg-gradient-to-br from-amber-500/5 to-transparent">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-amber-500/20 p-3 text-amber-300">
          <Droplets className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            Circle Testnet Faucet
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Request testnet USDC + native gas via Circle{" "}
            <code className="text-amber-300/90">/v1/faucet/drips</code> API.
            {isTestnet ? " Hackathon mode: testnet." : ""}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={blockchain}
              onChange={(e) =>
                setBlockchain(e.target.value as CircleFaucetBlockchain)
              }
              className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-white"
            >
              {chains.map((c) => (
                <option key={c.id} value={c.circleFaucet}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={requestFunds}
              disabled={!isConnected || status === "loading"}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {status === "loading" ? (
                <Loader2 className="inline h-4 w-4 animate-spin" />
              ) : (
                "Fund Wallet (Circle API)"
              )}
            </button>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300 hover:text-white"
            >
              Web faucet <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${
                status === "error" ? "text-rose-300" : "text-emerald-300"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Fund Arc first for Arc-native fees. For Base→Arc bridges, fund Base too.
          </p>
        </div>
      </div>
    </div>
  );
}
