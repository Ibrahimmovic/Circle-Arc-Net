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

function envDefault(): NetworkMode {
  const env = process.env.NEXT_PUBLIC_NETWORK as NetworkMode | undefined;
  return env === "mainnet" || env === "testnet" ? env : "mainnet";
}

function readInitial(): NetworkMode {
  if (typeof window === "undefined") {
    return envDefault();
  }
  const fromUrl = new URLSearchParams(window.location.search).get("network");
  if (fromUrl === "mainnet" || fromUrl === "testnet") return fromUrl;
  // Deploy default wins over stale localStorage (e.g. after switching Vercel to mainnet).
  const fromEnv = envDefault();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "mainnet" || stored === "testnet") {
    if (stored !== fromEnv && !localStorage.getItem(`${STORAGE_KEY}-pinned`)) {
      return fromEnv;
    }
    return stored;
  }
  return fromEnv;
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkMode>("mainnet");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNetworkState(readInitial());
    setReady(true);
  }, []);

  const setNetwork = useCallback((mode: NetworkMode) => {
    setNetworkState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem(`${STORAGE_KEY}-pinned`, "1");
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("network", mode);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
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
      network: envDefault(),
      setNetwork: () => {},
      isTestnet: envDefault() === "testnet",
    };
  }
  return ctx;
}
