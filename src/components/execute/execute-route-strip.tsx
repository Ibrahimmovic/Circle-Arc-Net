"use client";

import { motion } from "framer-motion";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { getExecChains } from "@/lib/execution/chain-catalog";
import { useNetwork } from "@/providers/network-context";

/** Slim route preview for the routes panel — execute-only, not the home flow diagram. */
export function ExecuteRouteStrip({
  fromChain,
  toChain,
  fromToken,
  toToken,
}: {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
}) {
  const { network } = useNetwork();
  const chains = getExecChains(network);
  const fromLabel = chains.find((c) => c.appKitChain === fromChain)?.label ?? fromChain;
  const toLabel = chains.find((c) => c.appKitChain === toChain)?.label ?? toChain;
  const isBridge = fromChain !== toChain;

  return (
    <div className="execute-route-strip">
      <div className="execute-route-strip__node">
        <TokenAvatar symbol={fromToken} chainKey={fromChain} size={36} glass glassVariant="cyan" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white">{fromToken}</p>
          <p className="truncate text-[10px] text-white/45">{fromLabel}</p>
        </div>
      </div>

      <div className="execute-route-strip__bridge" aria-hidden>
        <div className="execute-route-strip__line" />
        <motion.span
          className="execute-route-strip__packet"
          animate={{ left: ["0%", "calc(100% - 0.5rem)"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
        <span className="execute-route-strip__label">
          {isBridge ? "Bridge path" : "Swap path"}
        </span>
      </div>

      <div className="execute-route-strip__node execute-route-strip__node--dest">
        <TokenAvatar symbol={toToken} chainKey={toChain} size={36} glass glassVariant="violet" />
        <div className="min-w-0 text-right">
          <p className="truncate text-xs font-semibold text-white">{toToken}</p>
          <p className="truncate text-[10px] text-white/45">{toLabel}</p>
        </div>
      </div>

      <p className="execute-route-strip__hint col-span-full text-center text-[11px] text-white/45">
        Enter an amount in the swap panel to load live routes
      </p>
    </div>
  );
}
