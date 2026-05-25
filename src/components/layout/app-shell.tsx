import { Sidebar } from "./sidebar";
import { WalletButton } from "./wallet-button";
import { MeshBackground } from "@/components/ui/mesh-background";
import { ApiStatusBar } from "./api-status-bar";
import { NetworkToggle } from "./network-toggle";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row bg-[#030712]">
      <MeshBackground />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <div className="border-b border-slate-800 bg-slate-950/95 px-4 py-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <NetworkToggle />
            <WalletButton />
          </div>
        </div>
        <header className="border-b border-slate-800/80 bg-slate-950/90 px-6 py-5 lg:px-10">
          <h1 className="font-display text-xl font-bold text-white lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
          )}
          <div className="mt-3">
            <ApiStatusBar />
          </div>
        </header>
        <main className="relative z-10 flex-1 px-6 py-8 lg:px-10 grid-mesh">
          {children}
        </main>
      </div>
    </div>
  );
}
