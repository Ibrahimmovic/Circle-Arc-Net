import { Sidebar } from "./sidebar";
import { WalletButton } from "./wallet-button";

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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-6 py-5 lg:px-10">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white lg:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
            <WalletButton />
          </div>
        </header>
        <main className="grid-mesh flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
