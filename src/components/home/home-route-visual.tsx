"use client";

import { motion } from "framer-motion";
import { chainIcon, tokenIcon } from "@/lib/token-visuals";
import { figmaEaseOut } from "@/design/motion-presets";

type RouteStep =
  | { kind: "asset"; symbol: string; chain: string; chainLabel: string }
  | { kind: "rail"; label: string; sub?: string };

const EXECUTION_ROUTE: RouteStep[] = [
  { kind: "asset", symbol: "USDC", chain: "Arc_Testnet", chainLabel: "Arc" },
  { kind: "rail", label: "CCTP", sub: "Circle" },
  { kind: "asset", symbol: "USDC", chain: "Base", chainLabel: "Base" },
  { kind: "rail", label: "LI.FI", sub: "Route" },
  { kind: "asset", symbol: "ETH", chain: "Ethereum", chainLabel: "Ethereum" },
];

function TokenDisc({
  symbol,
  chain,
  chainLabel,
  delay,
}: {
  symbol: string;
  chain: string;
  chainLabel: string;
  delay: number;
}) {
  const tokenSrc = tokenIcon(symbol);
  const chainSrc = chainIcon(chain);

  return (
    <motion.div
      className="route-node"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...figmaEaseOut, delay }}
    >
      <div className="route-node__disc">
        {tokenSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tokenSrc} alt="" className="route-node__token" />
        ) : (
          <span className="route-node__fallback">{symbol.slice(0, 3)}</span>
        )}
        {chainSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chainSrc} alt="" className="route-node__chain-badge" />
        )}
      </div>
      <p className="route-node__symbol">{symbol}</p>
      <p className="route-node__chain">{chainLabel}</p>
    </motion.div>
  );
}

function RouteConnector({ label, sub, delay }: { label: string; sub?: string; delay: number }) {
  return (
    <motion.div
      className="route-connector"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...figmaEaseOut, delay }}
    >
      <div className="route-connector__line" aria-hidden>
        <motion.span
          className="route-connector__pulse"
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="route-connector__meta">
        <span className="route-connector__label">{label}</span>
        {sub && <span className="route-connector__sub">{sub}</span>}
      </div>
    </motion.div>
  );
}

export function HomeRouteVisual({ compact }: { compact?: boolean }) {
  return (
    <div className={`home-route-visual ${compact ? "home-route-visual--compact" : ""}`}>
      <div className="home-route-visual__frame">
        <div className="home-route-visual__header">
          <span className="home-route-visual__eyebrow">Live execution graph</span>
          <span className="home-route-visual__status">
            <span className="home-route-visual__dot" />
            Routes active
          </span>
        </div>

        <div className="home-route-visual__track">
          {EXECUTION_ROUTE.map((step, i) => {
            if (step.kind === "asset") {
              return (
                <TokenDisc
                  key={`${step.symbol}-${step.chain}-${i}`}
                  symbol={step.symbol}
                  chain={step.chain}
                  chainLabel={step.chainLabel}
                  delay={0.08 + i * 0.07}
                />
              );
            }
            return (
              <RouteConnector
                key={`rail-${step.label}-${i}`}
                label={step.label}
                sub={step.sub}
                delay={0.1 + i * 0.07}
              />
            );
          })}
        </div>

        <div className="home-route-visual__chains">
          {[
            { chain: "Arbitrum", symbol: "ARB" },
            { chain: "Optimism", symbol: "OP" },
            { chain: "Polygon", symbol: "MATIC" },
          ].map(({ chain, symbol }, i) => (
            <motion.div
              key={chain}
              className="route-orbit-chip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              {tokenIcon(symbol) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tokenIcon(symbol)} alt="" className="h-4 w-4 rounded-full" />
              )}
              <span>{chain}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="home-route-visual__glow" aria-hidden />
    </div>
  );
}
