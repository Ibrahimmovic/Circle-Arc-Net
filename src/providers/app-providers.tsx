"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useEffect, useState } from "react";
import { wagmiConfig } from "./wagmi-config";
import { NetworkProvider } from "./network-context";
import { FramerProvider } from "@/components/motion/framer-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/40 border-t-indigo-300" />
      </div>
    );
  }

  return (
    <FramerProvider>
      <NetworkProvider>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
      </NetworkProvider>
    </FramerProvider>
  );
}
