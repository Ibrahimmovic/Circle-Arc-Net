"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
import { wagmiConfig } from "./wagmi-config";

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        <p className="mt-4 font-display text-sm text-cyan-300/90">
          Loading Agora Forge…
        </p>
      </div>
    </div>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingShell />;
  }

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
