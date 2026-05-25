"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NetworkMode } from "@/lib/network";

const STORAGE_KEY = "agora-forge-network";

type NetworkContextValue = {
  network: NetworkMode;
  setNetwork: (mode: NetworkMode) => void;
  isTestnet: boolean;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

function readInitial(): NetworkMode {
  if (typeof window === "undefined") {
    return (process.env.NEXT_PUBLIC_NETWORK as NetworkMode) ?? "testnet";
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "mainnet" || stored === "testnet") return stored;
  return (process.env.NEXT_PUBLIC_NETWORK as NetworkMode) ?? "testnet";
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkMode>("testnet");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNetworkState(readInitial());
    setReady(true);
  }, []);

  const setNetwork = useCallback((mode: NetworkMode) => {
    setNetworkState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent("agora-network-change", { detail: mode }));
  }, []);

  if (!ready) {
    return <>{children}</>;
  }

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        isTestnet: network === "testnet",
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    return {
      network: (process.env.NEXT_PUBLIC_NETWORK as NetworkMode) ?? "testnet",
      setNetwork: () => {},
      isTestnet: true,
    };
  }
  return ctx;
}
