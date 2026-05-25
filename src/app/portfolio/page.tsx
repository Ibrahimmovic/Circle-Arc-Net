"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PortfolioCommandCenter } from "@/components/portfolio/portfolio-command-center";

export default function PortfolioPage() {
  return (
    <AppShell
      title="Adaptive Portfolio"
      subtitle="Multichain command center · tokens · NFTs · activity · spam shield · regime rebalance"
    >
      <PortfolioCommandCenter />
    </AppShell>
  );
}
