"use client";

import { motion } from "framer-motion";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { figmaEaseOut } from "@/design/motion-presets";
import { getExecChains } from "@/lib/execution/chain-catalog";
import { useNetwork } from "@/providers/network-context";

function FlowLink({ delay }: { delay: number }) {
  return (
    <motion.div
      className="exec-link"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...figmaEaseOut, delay }}
      aria-hidden
    >
      <div className="exec-link__track">
        <div className="exec-link__line" />
        <motion.span
          className="exec-link__pulse"
          animate={{ left: ["0%", "calc(100% - 1.25rem)"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay }}
        />
      </div>
    </motion.div>
  );
}

export function ExecuteDeskVisual({
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
    <div className="exec-visual exec-visual--glass exec-visual--desk mt-4">
      <div className="exec-visual__flow exec-visual__flow--compact">
        <motion.div
          className="exec-node"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...figmaEaseOut, delay: 0.04 }}
        >
          <div className="exec-node__avatar exec-token-wrap">
            <TokenAvatar symbol={fromToken} chainKey={fromChain} size={44} glass glassVariant="cyan" />
          </div>
          <p className="exec-node__symbol">{fromToken}</p>
          <p className="exec-node__chain">{fromLabel}</p>
          <p className="exec-node__amount text-white/45">Source</p>
        </motion.div>

        <div className="exec-visual__rail-col">
          <FlowLink delay={0.1} />
          <motion.div
            className="exec-rail"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...figmaEaseOut, delay: 0.14 }}
          >
            <span className="exec-rail__label">Live routes</span>
            <span className="exec-rail__detail">CCTP · LI.FI · Uniswap</span>
          </motion.div>
        </div>

        <motion.div
          className="exec-node"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...figmaEaseOut, delay: 0.12 }}
        >
          <div className="exec-node__avatar exec-token-wrap exec-token-wrap--violet">
            <TokenAvatar symbol={toToken} chainKey={toChain} size={44} glass glassVariant="violet" />
          </div>
          <p className="exec-node__symbol">{toToken}</p>
          <p className="exec-node__chain">{toLabel}</p>
          <p className="exec-node__amount text-white/45">Destination</p>
        </motion.div>
      </div>

      <div className="exec-visual__metrics exec-visual__metrics--compact">
        {[
          { label: "Providers", value: "3", suffix: "live" },
          { label: "Path", value: isBridge ? "Bridge" : "Swap", suffix: "" },
          { label: "Icons", value: "CG", suffix: "live" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            className="exec-metric"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...figmaEaseOut, delay: 0.2 + i * 0.05 }}
          >
            <p className="exec-metric__label">{m.label}</p>
            <p className="exec-metric__value">
              {m.value}
              {m.suffix && <span className="exec-metric__suffix">{m.suffix}</span>}
            </p>
          </motion.div>
        ))}
      </div>

      <p className="exec-visual__hint mt-3 text-center text-xs text-white/45">
        Enter an amount on the left to fetch live quotes
      </p>
    </div>
  );
}
