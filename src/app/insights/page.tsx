"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { RegimeBadge } from "@/components/portfolio/regime-badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatUsd } from "@/lib/utils";
import { Lightbulb, ArrowRight, TrendingUp, Scale, Zap } from "lucide-react";

const STEPS = [
  {
    icon: TrendingUp,
    title: "Reads the market",
    text: "CoinGecko BTC/ETH momentum sets risk-on, neutral, or risk-off.",
  },
  {
    icon: Scale,
    title: "Scans your wallet",
    text: "Zerion + GoldRush show USDC/USDT across Ethereum, Base, Polygon, Arbitrum, and more.",
  },
  {
    icon: Zap,
    title: "Suggests moves",
    text: "When one chain is overweight, we queue a Circle CCTP bridge you can run on Execute.",
  },
];

export default function InsightsPage() {
  const { address, isConnected } = useAccount();
  const { data } = useDashboard(isConnected ? address : undefined);
  const analysis = data?.analysis;

  return (
    <AppShell
      title="Portfolio Insights"
      subtitle="Plain-language rebalance suggestions — not a black-box bot"
    >
      <div className="luxury-hero rounded-3xl p-8 lg:p-10">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/20 p-4">
            <Lightbulb className="h-8 w-8 text-amber-300" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              What is this page?
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">
              A simple coach for your hackathon demo: it explains{" "}
              <strong className="text-white">why</strong> a bridge might help based on
              live macro data and your real multichain balance — then you approve
              each move on Execute.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="luxury-card rounded-2xl p-6">
            <Icon className="h-6 w-6 text-cyan-400" />
            <p className="mt-3 font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      {!isConnected && (
        <p className="mt-8 text-center text-slate-400">
          Connect wallet to see personalized suggestions on Portfolio.
        </p>
      )}

      {isConnected && analysis && (
        <div className="mt-8 luxury-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-4">
            <RegimeBadge regime={analysis.regime} />
            <span className="text-2xl font-bold text-white">
              {formatUsd(analysis.totalUsd)}
            </span>
          </div>
          <p className="mt-4 text-slate-300">{analysis.arcAdvantage}</p>
          {analysis.rebalanceActions.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {analysis.rebalanceActions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-3"
                >
                  <p className="text-white">
                    Bridge {formatUsd(a.amountUsd)} from {a.fromChain} to {a.toChain}
                  </p>
                  <p className="text-sm text-slate-400">{a.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-emerald-300">No rebalance needed — you are on target.</p>
          )}
          <Link
            href="/execute"
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
          >
            Go to Execute <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </AppShell>
  );
}
