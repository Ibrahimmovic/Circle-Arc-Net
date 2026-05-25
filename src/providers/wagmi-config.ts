import { http, createConfig } from "wagmi";
import { base, baseSepolia, mainnet, arbitrum, polygon } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon, baseSepolia],
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
  },
  ssr: true,
});
