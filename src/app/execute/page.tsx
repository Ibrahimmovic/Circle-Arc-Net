import { AppShell } from "@/components/layout/app-shell";
import { BridgePanel } from "@/components/execute/bridge-panel";

export default function ExecutePage() {
  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Circle App Kit · CCTP USDC bridges · Swap Kit · Arc USDC fee economics"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="glass-panel rounded-2xl p-6 text-sm text-slate-400 leading-relaxed">
          <p>
            Execution layer powered by{" "}
            <strong className="text-cyan-300">@circle-fin/app-kit</strong> and{" "}
            <strong className="text-cyan-300">@circle-fin/adapter-viem-v2</strong>.
            Bridge USDC across EVM chains with Circle&apos;s Cross-Chain Transfer
            Protocol. Settlement on{" "}
            <strong className="text-violet-300">Arc</strong> offers sub-second
            finality and ~$0.01 USDC transaction fees — built for high-frequency
            agent strategies.
          </p>
        </div>

        <BridgePanel />

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "CCTP",
              desc: "Burn & mint USDC across 45+ chain routes",
            },
            {
              title: "Gateway",
              desc: "Unified USDC balance · sub-500ms transfers",
            },
            {
              title: "Nanopayments",
              desc: "Gas-free micro USDC for agent commerce",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-panel rounded-xl p-5 text-center"
            >
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
