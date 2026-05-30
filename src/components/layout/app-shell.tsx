import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileHeader } from "./mobile-header";
import { WalletButton } from "./wallet-button";
import { MeshBackground } from "@/components/ui/mesh-background";
import { CinematicCloudBackdrop } from "@/components/ui/cinematic-cloud-backdrop";
import { ApiStatusBar } from "./api-status-bar";
import { NetworkToggle } from "./network-toggle";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  title,
  subtitle,
  variant = "default",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  variant?: "default" | "home" | "portfolio" | "execute";
}) {
  const isHome = variant === "home";
  const isPortfolio = variant === "portfolio";
  const isExecute = variant === "execute";
  const isCinematic = isHome || isPortfolio || isExecute;
  const isGlassTopbar = isCinematic;

  return (
    <div
      className={cn(
        "relative flex min-h-screen min-h-[100dvh] flex-col lg:flex-row",
        isCinematic ? "app-shell--cinematic" : "bg-[#030712]",
        isHome && "app-shell--home",
        isPortfolio && "app-shell--portfolio",
        isExecute && "app-shell--execute",
      )}
    >
      {isCinematic && <CinematicCloudBackdrop className="app-shell__sky" />}
      {!isCinematic && <MeshBackground />}
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col pb-nav lg:pb-0">
        <MobileHeader />
        <div
          className={cn(
            "app-shell-topbar border-b px-3 py-2.5 sm:px-4 lg:px-8 lg:py-3",
            isGlassTopbar
              ? "app-shell-topbar--glass border-white/10 bg-white/[0.06] backdrop-blur-2xl"
              : "border-slate-800 bg-slate-950/95",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NetworkToggle variant={isGlassTopbar ? "home" : "default"} />
            <WalletButton variant={isGlassTopbar ? "home" : "default"} />
          </div>
          {(isHome || isExecute) && (
            <div className="mt-2 overflow-x-auto">
              <ApiStatusBar />
            </div>
          )}
        </div>
        {!isHome && !isExecute && (
          <header
            className={cn(
              "app-shell-header border-b px-4 py-4 sm:px-6 lg:px-10 lg:py-5",
              isPortfolio
                ? "app-shell-header--glass border-white/10 bg-white/[0.05] backdrop-blur-2xl"
                : "border-slate-800/80 bg-slate-950/90",
            )}
          >
            <h1
              className={cn(
                "font-display text-lg font-bold sm:text-xl lg:text-2xl",
                isPortfolio ? "text-white" : "text-white",
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  "mt-1 text-xs sm:text-sm",
                  isPortfolio ? "text-white/60" : "text-slate-300",
                )}
              >
                {subtitle}
              </p>
            )}
            <div className="mt-2 overflow-x-auto sm:mt-3">
              <ApiStatusBar variant={isPortfolio ? "minimal" : "default"} />
            </div>
          </header>
        )}
        <main
          className={cn(
            "app-shell-main relative z-10 flex-1",
            isHome && "grid-mesh",
            isExecute && "execute-main min-w-0 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8",
            isPortfolio && "portfolio-main px-4 py-5 sm:px-6 sm:py-8 lg:px-10",
            !isHome && !isPortfolio && !isExecute && "grid-mesh px-4 py-5 sm:px-6 sm:py-8 lg:px-10",
          )}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
