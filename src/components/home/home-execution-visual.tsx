"use client";

import { motion } from "framer-motion";
import { TokenAvatar } from "@/components/execute/token-avatar";
import { figmaEaseOut } from "@/design/motion-presets";

type FlowNode = {
  id: string;
  symbol: string;
  chainKey: string;
  chainLabel: string;
  amount: string;
};

const PRIMARY_FLOW: FlowNode[] = [
  {
    id: "src",
    symbol: "USDC",
    chainKey: "Arc_Testnet",
    chainLabel: "Arc",
    amount: "1,000.00",
  },
  {
    id: "mid",
    symbol: "USDC",
    chainKey: "Base",
    chainLabel: "Base",
    amount: "999.80",
  },
  {
    id: "dst",
    symbol: "ETH",
    chainKey: "Ethereum",
    chainLabel: "Ethereum",
    amount: "0.412",
  },
];

const RAILS = [
  { id: "cctp", label: "Circle CCTP", detail: "Native burn · mint" },
  { id: "lifi", label: "LI.FI", detail: "Best route · 12 quotes" },
] as const;

const METRICS = [
  { label: "Routes found", value: "12", suffix: "live" },
  { label: "Est. settlement", value: "2.1", suffix: "s" },
  { label: "Max slippage", value: "0.02", suffix: "%" },
] as const;

const SUPPORTED = [
  { symbol: "ARB", chainKey: "Arbitrum", label: "Arbitrum" },
  { symbol: "OP", chainKey: "Optimism", label: "Optimism" },
  { symbol: "MATIC", chainKey: "Polygon", label: "Polygon" },
  { symbol: "USDC", chainKey: "Base", label: "Base" },
] as const;

function AnimatedMetric({
  label,
  value,
  suffix,
  delay,
}: {
  label: string;
  value: string;
  suffix: string;
  delay: number;
}) {
  return (
    <motion.div
      className="exec-metric"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...figmaEaseOut, delay }}
    >
      <p className="exec-metric__label">{label}</p>
      <p className="exec-metric__value">
        {value}
        <span className="exec-metric__suffix">{suffix}</span>
      </p>
    </motion.div>
  );
}

const NODE_VARIANTS = ["cyan", "violet", "coral"] as const;

function FlowNodeCard({
  node,
  delay,
  variant = "cyan",
}: {
  node: FlowNode;
  delay: number;
  variant?: (typeof NODE_VARIANTS)[number];
}) {
  return (
    <motion.div
      className="exec-node"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...figmaEaseOut, delay }}
    >
      <div
        className={`exec-node__avatar exec-token-wrap ${
          variant !== "cyan" ? `exec-token-wrap--${variant}` : ""
        }`}
      >
        <TokenAvatar symbol={node.symbol} chainKey={node.chainKey} size={48} />
      </div>
      <p className="exec-node__symbol">{node.symbol}</p>
      <p className="exec-node__chain">{node.chainLabel}</p>
      <p className="exec-node__amount">{node.amount}</p>
    </motion.div>
  );
}

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
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay }}
        />
      </div>
    </motion.div>
  );
}

function RailBadge({
  label,
  detail,
  delay,
}: {
  label: string;
  detail: string;
  delay: number;
}) {
  return (
    <motion.div
      className="exec-rail"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...figmaEaseOut, delay }}
    >
      <span className="exec-rail__label">{label}</span>
      {detail && <span className="exec-rail__detail">{detail}</span>}
    </motion.div>
  );
}

import { GlassPanel } from "@/components/ui/glass-ui";

export function HomeExecutionVisual() {
  return (
    <div className="exec-visual exec-visual--glass exec-visual--home">
      <GlassPanel strong className="exec-visual__shell !rounded-2xl !p-0 overflow-hidden">
        <div className="exec-visual__chrome">
          <div className="exec-visual__chrome-left">
            <span className="exec-visual__dot exec-visual__dot--live" />
            <span className="exec-visual__title">Execution desk</span>
          </div>
          <span className="exec-visual__tag">Multichain · live quotes</span>
        </div>

        <div className="exec-visual__flow">
          <FlowNodeCard node={PRIMARY_FLOW[0]} delay={0.06} variant="cyan" />
          <div className="exec-visual__rail-col">
            <FlowLink delay={0.12} />
            <RailBadge {...RAILS[0]} delay={0.18} />
          </div>
          <FlowNodeCard node={PRIMARY_FLOW[1]} delay={0.14} variant="violet" />
          <div className="exec-visual__rail-col">
            <FlowLink delay={0.2} />
            <RailBadge {...RAILS[1]} delay={0.26} />
          </div>
          <FlowNodeCard node={PRIMARY_FLOW[2]} delay={0.22} variant="coral" />
        </div>

        <div className="exec-visual__metrics">
          {METRICS.map((m, i) => (
            <AnimatedMetric key={m.label} {...m} delay={0.32 + i * 0.06} />
          ))}
        </div>

        <div className="exec-visual__footer">
          <span className="exec-visual__footer-label">Supported networks</span>
          <div className="exec-visual__chips">
            {SUPPORTED.map(({ symbol, chainKey, label }, i) => (
              <motion.div
                key={label}
                className="exec-chip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                <span className="exec-chip__icon exec-token-wrap exec-token-wrap--sm">
                  <TokenAvatar symbol={symbol} chainKey={chainKey} size={18} />
                </span>
                <span>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="exec-visual__sheen" aria-hidden />
      <div className="exec-visual__depth" aria-hidden />
    </div>
  );
}
