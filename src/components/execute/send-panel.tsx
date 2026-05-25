"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Send, Loader2 } from "lucide-react";
import { TESTNET_HOME_CHAIN } from "@/lib/network";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { RecipientField } from "@/components/ui/recipient-field";
import { RouteCard } from "./route-card";
import { pushTx } from "@/lib/tx-store";
import { useNetwork } from "@/providers/network-context";
import { ArcFeeBadge } from "./arc-fee-badge";

export function SendPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { isTestnet } = useNetwork();
  const chain = isTestnet ? TESTNET_HOME_CHAIN : "Ethereum";
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("5");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
  const needsSwitch = isConnected && chainId !== defaultWalletChainId && isTestnet;

  const runSend = useCallback(async () => {
    if (!isConnected || !kitKey) {
      setMessage("Connect wallet + KIT_KEY required.");
      setStatus("error");
      return;
    }
    if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setMessage("Enter a valid recipient address (0x…).");
      setStatus("error");
      return;
    }
    if (needsSwitch) {
      setMessage("Switch to Arc Testnet first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      installCircleProxyFetch();
      const { AppKit } = await import("@circle-fin/app-kit");
      const { createViemAdapterFromProvider } = await import(
        "@circle-fin/adapter-viem-v2"
      );
      const kit = new AppKit();
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as never,
      });
      await kit.send({
        from: { adapter, chain: chain as never },
        to: recipient,
        amount,
        token: "USDC",
      });
      pushTx({
        type: "send",
        status: "success",
        summary: `Sent ${amount} USDC → ${recipient.slice(0, 8)}…`,
        feeUsd: "Arc USDC",
      });
      setStatus("success");
      setMessage(`USDC sent to friend on ${isTestnet ? "Arc Testnet" : chain}.`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Send failed");
    }
  }, [isConnected, kitKey, recipient, amount, chain, needsSwitch, isTestnet]);

  return (
    <div className="panel-elevated rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-3 text-violet-300">
          <Send className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Send USDC</h3>
          <p className="text-sm text-slate-300">Pay friends · same chain · Arc USDC gas on testnet</p>
        </div>
      </div>

      <div className="mb-4">
        <ArcFeeBadge compact />
      </div>

      <RouteCard
        fromLabel={isTestnet ? "Arc Testnet" : "Your chain"}
        toLabel="Friend wallet"
        amount={amount}
      />

      {needsSwitch && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: defaultWalletChainId })}
          className="mb-4 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-sm text-amber-100"
        >
          Switch to Arc Testnet
        </button>
      )}

      <RecipientField
        value={recipient}
        onChange={setRecipient}
        label="Friend's wallet address"
        placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      />

      <label className="mt-3 block">
        <span className="text-xs uppercase text-slate-400">USDC amount</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 font-mono text-white"
        />
      </label>

      {message && (
        <p
          className={`mt-4 rounded-xl p-4 text-sm ${
            status === "error" ? "bg-rose-950/80 text-rose-100" : "bg-emerald-950/80 text-emerald-100"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={runSend}
        className="btn-primary mt-6 w-full rounded-xl py-3 text-sm font-bold text-white"
      >
        {status === "loading" ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send USDC"}
      </button>
    </div>
  );
}
