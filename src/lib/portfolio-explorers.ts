import { APP_KIT_TO_WAGMI_CHAIN_ID } from "@/lib/chains";
import { txExplorerLink } from "@/lib/explorers";

/** Map Zerion / display chain ids to wagmi chain id for explorer links. */
const ZERION_CHAIN_TO_WAGMI: Record<string, number> = {
  ethereum: 11155111,
  "ethereum-sepolia": 11155111,
  base: 84532,
  "base-sepolia": 84532,
  arbitrum: 421614,
  "arbitrum-sepolia": 421614,
  optimism: 11155420,
  "optimism-sepolia": 11155420,
  polygon: 80002,
  avalanche: 43113,
  "arc-testnet": 5042002,
  arc: 5042002,
};

export function txExplorerLinkForZerionChain(
  chainKey: string,
  hash: string,
): string | undefined {
  const normalized = chainKey.toLowerCase().replace(/\s+/g, "-");
  const wagmiId =
    ZERION_CHAIN_TO_WAGMI[normalized] ??
    APP_KIT_TO_WAGMI_CHAIN_ID[chainKey.replace(/\s+/g, "_")] ??
    Object.entries(ZERION_CHAIN_TO_WAGMI).find(([k]) =>
      normalized.includes(k),
    )?.[1];
  if (wagmiId == null) return undefined;
  return txExplorerLink(wagmiId, hash);
}
