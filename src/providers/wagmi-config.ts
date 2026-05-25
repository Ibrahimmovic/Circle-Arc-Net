import { http, createConfig } from "wagmi";
import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  optimismSepolia,
  avalancheFuji,
  polygon,
} from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { arcTestnet } from "@/lib/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
const testnet =
  (process.env.NEXT_PUBLIC_NETWORK ?? "testnet") !== "mainnet";

const testnetChains = [
  arcTestnet,
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  optimismSepolia,
  avalancheFuji,
] as const;

export const wagmiConfig = createConfig({
  chains: testnet
    ? [...testnetChains]
    : [mainnet, base, arbitrum, polygon, baseSepolia],
  connectors: [
    injected(),
    ...(projectId
      ? [walletConnect({ projectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [avalancheFuji.id]: http(),
  },
  ssr: false,
});

/** Default wallet chain: Arc Testnet on testnet, Ethereum on mainnet. */
export const defaultWalletChainId = testnet ? arcTestnet.id : mainnet.id;
