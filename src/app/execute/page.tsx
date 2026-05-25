import { AppShell } from "@/components/layout/app-shell";
import { ExecuteHub } from "@/components/execute/execute-hub";
import { MarketTicker } from "@/components/dashboard/market-ticker";

export default function ExecutePage() {
  return (
    <AppShell
      title="Cross-Chain Execution"
      subtitle="Circle CCTP Bridge · Swap Kit · Faucet · USDC fees on Arc"
    >
      <div className="space-y-6">
        <MarketTicker />
        <ExecuteHub />
      </div>
    </AppShell>
  );
}
