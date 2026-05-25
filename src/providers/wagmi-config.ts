import { http, createConfig } from "wagmi";
import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  polygon,
} from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
const testnet =
  (process.env.NEXT_PUBLIC_NETWORK ?? "testnet") !== "mainnet";

export const wagmiConfig = createConfig({
  chains: testnet
    ? [baseSepolia, sepolia, arbitrumSepolia, mainnet, base]
    : [mainnet, base, arbitrum, polygon, baseSepolia],
  connectors: [
    injected(),
    ...(projectId
      ? [walletConnect({ projectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: false,
});
