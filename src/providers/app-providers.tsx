"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
import { wagmiConfig } from "./wagmi-config";
import { NetworkProvider } from "./network-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/40 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <NetworkProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </NetworkProvider>
  );
}
