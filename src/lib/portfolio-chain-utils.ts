import { canonicalChainKey } from "@/lib/portfolio-engine";
import type { PortfolioAsset, PortfolioNft } from "@/lib/portfolio-wallet-types";

export function assetMatchesChain(
  asset: PortfolioAsset,
  selectedChainId: string,
): boolean {
  if (!selectedChainId || selectedChainId === "all") return true;
  const a = canonicalChainKey(asset.chainId ?? asset.chain);
  const b = canonicalChainKey(selectedChainId);
  return a === b;
}

export function nftMatchesChain(nft: PortfolioNft, selectedChainId: string): boolean {
  if (!selectedChainId || selectedChainId === "all") return true;
  return canonicalChainKey(nft.chain) === canonicalChainKey(selectedChainId);
}
