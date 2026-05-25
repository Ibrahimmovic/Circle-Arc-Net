import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileHeader } from "./mobile-header";
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
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col bg-[#030712] lg:flex-row">
      <MeshBackground />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col pb-nav lg:pb-0">
        <MobileHeader />
        <div className="border-b border-slate-800 bg-slate-950/95 px-3 py-2.5 sm:px-4 lg:px-8 lg:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NetworkToggle />
            <WalletButton />
          </div>
        </div>
        <header className="border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
          <h1 className="font-display text-lg font-bold text-white sm:text-xl lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">{subtitle}</p>
          )}
          <div className="mt-2 overflow-x-auto sm:mt-3">
            <ApiStatusBar />
          </div>
        </header>
        <main className="relative z-10 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10 grid-mesh">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
