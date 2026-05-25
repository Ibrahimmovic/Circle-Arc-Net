import { arcTestnet } from "@/lib/chains";

export async function getWalletChainId(): Promise<number | null> {
  if (!window.ethereum) return null;
  const hex = (await (
    window.ethereum as { request: (a: { method: string }) => Promise<string> }
  ).request({ method: "eth_chainId" })) as string;
  return parseInt(hex, 16);
}

export async function waitForWalletChain(
  chainId: number,
  maxMs = 20_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const current = await getWalletChainId();
    if (current === chainId) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(
    `Wallet is still not on chain ${chainId}. Open Rabby/MetaMask and switch network, then try again.`,
  );
}

export function chainIdToHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

export async function switchWalletToChain(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error("Wallet not found");
  const provider = window.ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
  const hex = chainIdToHex(chainId);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (e) {
    const err = e as { code?: number };
    if (err.code === 4902 && chainId === arcTestnet.id) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: arcTestnet.name,
            rpcUrls: arcTestnet.rpcUrls.default.http,
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
            blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
          },
        ],
      });
    } else {
      throw e;
    }
  }
  await waitForWalletChain(chainId);
}

export function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: number })?.code;
  return code === 4001 || msg.toLowerCase().includes("rejected");
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out — check your wallet or block explorer.`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
