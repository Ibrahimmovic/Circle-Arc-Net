"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import {
  ArrowRight,
  ArrowDownUp,
  Loader2,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { getBridgeChains, TESTNET_HOME_CHAIN } from "@/lib/network";
import { wagmiChainIdForAppKit } from "@/lib/chains";
import { defaultWalletChainId } from "@/providers/wagmi-config";
import { installCircleProxyFetch } from "@/lib/circle-proxy-fetch";
import {
  getBridgeKitConfig,
  getBridgeDestination,
  getSwapKitConfig,
} from "@/lib/kit-operations";
import {
  createWalletViemAdapter,
  executeCircleBridge,
} from "@/lib/circle-bridge-exec";
import { ensureCctpUsdcAllowance } from "@/lib/cctp-usdc-approve";
import { useNetwork } from "@/providers/network-context";
import { pushTx } from "@/lib/tx-store";
import {
  getTokensForChain,
  getSwapChain,
  toBaseUnits,
  getTestnetSwapChains,
} from "@/lib/execute-tokens";
import { formatLifiOutput } from "@/lib/lifi";
import {
  formatUniswapQuoteOut,
  executeUniswapV3Swap,
  executeEthToWethWrap,
  uniswapQuoteFromApi,
} from "@/lib/uniswap-v3";
import { getAddress } from "viem";
import { bridgeSubmitStatus } from "@/lib/bridge-status";
import { planRoute } from "@/lib/route-engine";
import {
  debitArcPlatformFee,
  ARC_PLATFORM_FEE_LABEL,
  ARC_CHAIN_ID,
} from "@/lib/arc-platform-fee";
import {
  chainIdToHex,
  isUserRejected,
  switchWalletToChain,
  withTimeout,
} from "@/lib/wallet-chain";
import { formatUnits } from "viem";
import { TokenAvatar } from "./token-avatar";
import { TokenPicker } from "./token-picker";
import { TokenBalanceLine } from "./token-balance-line";
import type { TokenBalanceRow } from "@/lib/wallet-balances";
import { RecipientField } from "@/components/ui/recipient-field";
import { TxScannerPanel } from "./tx-scanner-panel";
import { chainIdsForRoute } from "@/lib/explorers";
import {
  arcFeeScanStep,
  buildBridgeScanSteps,
  mergeScanSteps,
  scanStep,
  type TxScanStep,
} from "@/lib/tx-scanner";
import {
  gasPreviewForSwap,
  gasPreviewFromBridgeEstimate,
  type GasPreview,
} from "@/lib/gas-preview";
import { FeePreviewPanel } from "./fee-preview-panel";
import {
  WalletStepsProgress,
  type WalletStep,
} from "./wallet-steps-progress";
import type { ChainOption } from "@/lib/network";

type Status = "idle" | "loading" | "success" | "error";
type PickerSide = "from" | "to" | null;

export function ExchangeWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { network, isTestnet } = useNetwork();
  const kitKey = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  const chains: ChainOption[] = useMemo(
    () => (isTestnet ? getTestnetSwapChains() : getBridgeChains(network)),
    [isTestnet, network],
  );

  const [fromChain, setFromChain] = useState(TESTNET_HOME_CHAIN);
  const [toChain, setToChain] = useState("Base_Sepolia");
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showRecipient, setShowRecipient] = useState(false);
  const [picker, setPicker] = useState<PickerSide>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [quoteOut, setQuoteOut] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [scanSteps, setScanSteps] = useState<TxScanStep[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [balances, setBalances] = useState<TokenBalanceRow[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [gasPreview, setGasPreview] = useState<GasPreview | null>(null);
  const [gasPreviewLoading, setGasPreviewLoading] = useState(false);
  const cancelRef = useRef(false);
  const walletChainIds = useMemo(
    () => chainIdsForRoute(fromChain, toChain),
    [fromChain, toChain],
  );

  const publishScans = useCallback(
    (
      steps: TxScanStep[],
      log?: Omit<import("@/lib/tx-store").TxRecord, "id" | "timestamp" | "steps">,
    ) => {
      setScanSteps(steps);
      if (log) {
        pushTx({ ...log, steps });
      }
    },
    [],
  );

  const fromMeta = chains.find((c) => c.appKitChain === fromChain);
  const toMeta = chains.find((c) => c.appKitChain === toChain);
  const fromTokens = getTokensForChain(fromChain);
  const toTokens = getTokensForChain(toChain);
  const fromTokenMeta = fromTokens.find((t) => t.symbol === fromToken) ?? fromTokens[0];
  const toTokenMeta = toTokens.find((t) => t.symbol === toToken) ?? toTokens[0];

  const route = useMemo(() => {
    if (!fromTokenMeta || !toTokenMeta) return null;
    const plan = planRoute(fromChain, toChain, fromTokenMeta, toTokenMeta);
    if (
      fromChain !== toChain &&
      fromToken === "USDC" &&
      toToken === "USDC"
    ) {
      return {
        ...plan,
        kind: "circle-cctp" as const,
        signChain: fromChain,
        label: "Circle CCTP bridge",
        hint: "3 wallet steps: Arc fee, approve USDC, bridge burn",
      };
    }
    return plan;
  }, [fromChain, toChain, fromTokenMeta, toTokenMeta, fromToken, toToken]);

  const signChainId =
    wagmiChainIdForAppKit(route?.signChain ?? fromChain) ?? defaultWalletChainId;
  const needsSwitch = isConnected && chainId !== signChainId;

  useEffect(() => {
    installCircleProxyFetch();
    const list = isTestnet ? getTestnetSwapChains() : getBridgeChains(network);
    setFromChain(TESTNET_HOME_CHAIN);
    setToChain(list.find((c) => !c.isArc)?.appKitChain ?? "Base_Sepolia");
    setFromToken("USDC");
    setToToken("USDC");
    setAmount("");
    setMessage(null);
    setQuoteOut(null);
  }, [network, isTestnet]);

  /** Same-chain on L2 testnets: default USDC → WETH (demo-friendly). */
  useEffect(() => {
    if (
      isTestnet &&
      fromChain === toChain &&
      fromChain !== TESTNET_HOME_CHAIN &&
      fromToken === "USDC" &&
      toToken === "USDC"
    ) {
      setToToken("WETH");
    }
  }, [fromChain, toChain, fromToken, toToken, isTestnet]);

  const swapEnds = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromToken(toToken);
    setToToken(fromToken);
    setQuoteOut(null);
  };

  const getAdapter = useCallback(async () => createWalletViemAdapter(), []);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalances([]);
      return;
    }
    const chains = [...new Set([fromChain, toChain, TESTNET_HOME_CHAIN])].join(",");
    const id = window.setTimeout(async () => {
      setBalancesLoading(true);
      try {
        const res = await fetch(
          `/api/execute/balances?address=${address}&chains=${encodeURIComponent(chains)}`,
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.balances)) {
          setBalances(data.balances);
        }
      } catch {
        /* keep previous balances */
      } finally {
        setBalancesLoading(false);
      }
    }, 600);
    return () => window.clearTimeout(id);
  }, [address, isConnected, fromChain, toChain]);

  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !route) {
      setGasPreview(null);
      return;
    }
    const id = window.setTimeout(async () => {
      setGasPreviewLoading(true);
      try {
        if (route.kind === "circle-cctp" && kitKey && isConnected && address) {
          installCircleProxyFetch();
          const { AppKit } = await import("@circle-fin/app-kit");
          const kit = new AppKit();
          const adapter = await getAdapter();
          const est = await kit.estimateBridge({
            from: { adapter, chain: fromChain as never },
            to: getBridgeDestination(toChain, adapter, network, recipient) as never,
            amount,
            config: getBridgeKitConfig(),
            token: "USDC",
          });
          setGasPreview(
            gasPreviewFromBridgeEstimate(
              { gasFees: est.gasFees, fees: est.fees },
              amount,
              false,
            ),
          );
        } else if (route.kind === "uniswap-v3" || route.kind === "eth-wrap") {
          setGasPreview(gasPreviewForSwap(fromMeta?.label ?? "chain"));
        } else if (route.kind === "circle-swap") {
          setGasPreview(gasPreviewForSwap("Arc Testnet"));
        } else {
          setGasPreview(gasPreviewForSwap(fromMeta?.label ?? "source"));
        }
      } catch {
        setGasPreview(
          gasPreviewForSwap(fromMeta?.label ?? "Arc Testnet"),
        );
      } finally {
        setGasPreviewLoading(false);
      }
    }, 700);
    return () => window.clearTimeout(id);
  }, [
    amount,
    route,
    fromChain,
    toChain,
    network,
    recipient,
    kitKey,
    isConnected,
    address,
    fromMeta?.label,
    getAdapter,
  ]);

  const walletProgressSteps = useMemo((): WalletStep[] => {
    if (!isTestnet || status !== "loading") return [];
    const s = step ?? "";
    const m = s.match(/^(\d+)\//);
    const n = m ? Number.parseInt(m[1], 10) : 0;
    const isBridgeStepper = s.includes("Approve") || s.includes("Bridge");
    if (!isBridgeStepper && n <= 1) {
      return [
        {
          id: "fee",
          title: "Arc fee",
          state: n === 1 ? "active" : "pending",
        },
      ];
    }
    return [
      {
        id: "fee",
        title: "Arc fee",
        state: n >= 2 ? "done" : n === 1 ? "active" : "pending",
      },
      {
        id: "allow",
        title: "Approve",
        state: n === 2 ? "active" : n >= 3 ? "done" : "pending",
      },
      {
        id: "bridge",
        title: "Bridge burn",
        state: n >= 3 ? "active" : "pending",
      },
    ];
  }, [isTestnet, status, step]);

  const runQuote = useCallback(async (userInitiated = false) => {
    if (!isConnected || !address || !route) {
      if (userInitiated) {
        setStatus("error");
        setMessage("Connect wallet first.");
      }
      return;
    }
    if (!amount || Number(amount) <= 0) {
      if (userInitiated) {
        setStatus("error");
        setMessage("Enter an amount.");
      }
      return;
    }

    setQuoteLoading(true);
    if (userInitiated) {
      setStatus("idle");
      setMessage(null);
    }
    setQuoteOut(null);

    try {
      const fetchLifi = async (fc: string, tc: string, fSym: string, tSym: string, amt: string) => {
        const fromCfg = getSwapChain(fc);
        const toCfg = getSwapChain(tc);
        const meta = getTokensForChain(fc).find((t) => t.symbol === fSym) ?? fromTokenMeta!;
        if (!fromCfg || !toCfg) throw new Error("Unsupported chain");
        const qs = new URLSearchParams({
          fromChain: String(fromCfg.lifiChainId),
          toChain: String(toCfg.lifiChainId),
          fromToken: fSym,
          toToken: tSym,
          fromAmount: toBaseUnits(amt, meta.decimals),
          fromAddress: address,
        });
        const res = await fetch(`/api/lifi/quote?${qs}`);
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error ?? data.message ?? "No route";
          if (String(msg).includes("toChain")) {
            throw new Error("Try Base ↔ Arc — this testnet pair is not routed.");
          }
          if (String(msg).includes("No available quotes")) {
            throw new Error(
              "No LI.FI liquidity on this testnet. Use Base Sepolia for USDC↔WETH (Uniswap) or Arc for USDC↔EURC.",
            );
          }
          throw new Error(msg);
        }
        return data;
      };

      if (route.kind === "circle-swap" && kitKey) {
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        const est = await kit.estimateSwap({
          from: { adapter, chain: fromChain as never },
          tokenIn: fromTokenMeta!.circleKey as never,
          tokenOut: toTokenMeta!.circleKey as never,
          amountIn: amount,
          config: getSwapKitConfig(kitKey),
        });
        setQuoteOut(`${est.estimatedOutput?.amount ?? "—"} ${toToken}`);
        setMessage(route.hint);
        return;
      }

      if (route.kind === "circle-cctp") {
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const adapter = await getAdapter();
        await kit.estimateBridge({
          from: { adapter, chain: fromChain as never },
          to: getBridgeDestination(toChain, adapter, network, recipient) as never,
          amount,
          config: getBridgeKitConfig(),
          token: "USDC",
        });
        setQuoteOut(`~${amount} ${toToken} on ${toMeta?.label}`);
        setMessage(route.hint);
        return;
      }

      if (route.kind === "eth-wrap") {
        setQuoteOut(`~${amount} WETH (1:1 wrap)`);
        setMessage(route.hint);
        return;
      }

      if (route.kind === "uniswap-v3") {
        const cfg = getSwapChain(fromChain);
        if (!cfg) throw new Error("Unsupported chain");
        const qs = new URLSearchParams({
          chainId: String(cfg.lifiChainId),
          tokenIn: fromToken,
          tokenOut: toToken,
          amount,
        });
        const res = await fetch(`/api/uniswap/quote?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Uniswap quote failed");
        const quote = uniswapQuoteFromApi(data);
        setQuoteOut(formatUniswapQuoteOut(quote));
        setMessage(route.hint);
        return;
      }

      if (route.kind === "compound-swap-bridge") {
        const cfg = getSwapChain(fromChain);
        if (cfg) {
          try {
            const qs = new URLSearchParams({
              chainId: String(cfg.lifiChainId),
              tokenIn: fromToken,
              tokenOut: "USDC",
              amount,
            });
            const res = await fetch(`/api/uniswap/quote?${qs}`);
            const data = await res.json();
            if (res.ok) {
              const quote = uniswapQuoteFromApi(data);
              setQuoteOut(`${formatUniswapQuoteOut(quote)} → Arc via CCTP`);
              setMessage(route.hint);
              return;
            }
          } catch {
            /* fall through */
          }
        }
        setQuoteOut(`USDC on ${fromMeta?.label} → Arc`);
        setMessage(route.hint);
        return;
      }

      const data = await fetchLifi(fromChain, toChain, fromToken, toToken, amount);
      setQuoteOut(formatLifiOutput(data, toToken));
      setMessage(route.hint);
    } catch (e) {
      if (userInitiated) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Quote failed");
      }
    } finally {
      setQuoteLoading(false);
    }
  }, [
    isConnected,
    address,
    amount,
    route,
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromTokenMeta,
    toTokenMeta,
    kitKey,
    network,
    recipient,
    toMeta,
    fromMeta,
    getAdapter,
  ]);

  const runExchange = useCallback(async () => {
    if (!isConnected || !address || !route) {
      setStatus("error");
      setMessage("Connect wallet.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus("error");
      setMessage("Enter amount.");
      return;
    }

    setStatus("loading");
    setStep(null);
    setScanSteps([]);
    cancelRef.current = false;
    const collected: TxScanStep[] = [];
    const isBridgeFlow =
      route.kind === "circle-cctp" || route.kind === "compound-swap-bridge";
    const testnetWalletSteps = isTestnet
      ? isBridgeFlow
        ? 3
        : 2
      : 1;
    try {
      const fetchLifi = async (fc: string, tc: string, fSym: string, tSym: string, amt: string) => {
        const fromCfg = getSwapChain(fc);
        const toCfg = getSwapChain(tc);
        const meta = getTokensForChain(fc).find((t) => t.symbol === fSym) ?? fromTokenMeta!;
        if (!fromCfg || !toCfg) throw new Error("Unsupported chain");
        const qs = new URLSearchParams({
          fromChain: String(fromCfg.lifiChainId),
          toChain: String(toCfg.lifiChainId),
          fromToken: fSym,
          toToken: tSym,
          fromAmount: toBaseUnits(amt, meta.decimals),
          fromAddress: address,
        });
        const res = await fetch(`/api/lifi/quote?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? data.message ?? "Quote failed");
        return data;
      };

      const sendLifi = async (
        data: { transactionRequest?: { to?: string; data?: string; value?: string } },
        onChainId: number,
      ) => {
        const tx = data.transactionRequest;
        if (!tx?.to || !tx?.data) throw new Error("No transaction");
        const hash = (await withTimeout(
          (
            window.ethereum as {
              request: (args: { method: string; params: unknown[] }) => Promise<string>;
            }
          ).request({
            method: "eth_sendTransaction",
            params: [
              {
                chainId: chainIdToHex(onChainId),
                from: address,
                to: tx.to,
                data: tx.data,
                value: tx.value ?? "0x0",
              },
            ],
          }),
          180_000,
          "Transaction",
        )) as string;
        return hash;
      };

      if (isTestnet) {
        if (cancelRef.current) throw new Error("Cancelled.");
        setStep(`1/${testnetWalletSteps} · Arc platform fee`);
        setMessage(
          `Confirm ${ARC_PLATFORM_FEE_LABEL} on Arc Testnet (chain ${ARC_CHAIN_ID}) in your wallet.`,
        );
        const fee = await debitArcPlatformFee(address);
        if (!fee.ok) throw new Error(fee.message);
        if (fee.txHash) {
          collected.push(arcFeeScanStep(fee.txHash));
          setMessage(`Step 1/${testnetWalletSteps} done · Arc fee confirmed`);
        }
      }

      if (cancelRef.current) throw new Error("Cancelled.");

      const signLabel = chains.find((c) => c.appKitChain === route.signChain)?.label;
      setStep(
        isTestnet
          ? isBridgeFlow
            ? `2/${testnetWalletSteps} · Approve USDC`
            : `2/${testnetWalletSteps} · Execute`
          : "Execute",
      );
      setMessage(
        isBridgeFlow
          ? `Step 2/${testnetWalletSteps}: approve USDC on ${signLabel} — wallet will ask spending limit · then step 3 burns for bridge`
          : `Confirm swap on ${signLabel}…`,
      );
      await switchWalletToChain(signChainId);
      switchChain({ chainId: signChainId });
      const adapter = await getAdapter();

      if (route.kind === "eth-wrap") {
        const cfg = getSwapChain(fromChain);
        if (!cfg) throw new Error("Unsupported chain");
        const hash = await executeEthToWethWrap(
          cfg.lifiChainId,
          amount,
          getAddress(address),
          (msg) => setMessage(msg),
        );
        const steps = mergeScanSteps(collected, [
          scanStep("Wrap ETH → WETH", hash, cfg.lifiChainId),
        ]);
        publishScans(steps, {
          type: "swap",
          status: "success",
          summary: `ETH→WETH · ${hash.slice(0, 10)}`,
          feeUsd: "Arc USDC",
          hash,
        });
        setStatus("success");
        setStep(null);
        setMessage(`Wrapped ${amount} ETH → WETH on ${signLabel}`);
      } else if (route.kind === "uniswap-v3") {
        const cfg = getSwapChain(fromChain);
        if (!cfg) throw new Error("Unsupported chain");
        const qs = new URLSearchParams({
          chainId: String(cfg.lifiChainId),
          tokenIn: fromToken,
          tokenOut: toToken,
          amount,
        });
        const res = await fetch(`/api/uniswap/quote?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Quote failed");
        const quote = uniswapQuoteFromApi(data);
        const { swapHash, approveHash } = await executeUniswapV3Swap(
          quote,
          getAddress(address),
          (msg) => setMessage(msg),
        );
        const swapSteps = mergeScanSteps(
          collected,
          [
            ...(approveHash
              ? [scanStep("Approve USDC", approveHash, cfg.lifiChainId)]
              : []),
            scanStep("Uniswap swap", swapHash, cfg.lifiChainId),
          ],
        );
        publishScans(swapSteps, {
          type: "swap",
          status: "success",
          summary: `${fromToken}→${toToken} · ${swapHash.slice(0, 10)}`,
          feeUsd: "Arc USDC",
          hash: swapHash,
        });
        setStatus("success");
        setStep(null);
        setMessage(`Swap complete on ${signLabel} · Arc fee already paid`);
      } else if (route.kind === "circle-swap" && kitKey) {
        setMessage("Confirm swap in wallet (Arc Testnet)…");
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        await withTimeout(
          kit.swap({
            from: { adapter, chain: fromChain as never },
            tokenIn: fromTokenMeta!.circleKey as never,
            tokenOut: toTokenMeta!.circleKey as never,
            amountIn: amount,
            config: getSwapKitConfig(kitKey),
          }),
          180_000,
          "Swap",
        );
        publishScans(collected, {
          type: "swap",
          status: "success",
          summary: `${fromToken}→${toToken}`,
          feeUsd: "Arc USDC",
        });
        setStatus("success");
        setStep(null);
        setMessage(`Swap complete · fee paid on Arc`);
      } else if (route.kind === "circle-cctp") {
        let preApproveTx: string | undefined;
        if (fromToken === "USDC") {
          setStep(`2/${testnetWalletSteps} · Approve USDC`);
          const allowance = await ensureCctpUsdcAllowance(
            address,
            route.signChain,
            amount,
            (msg) => setMessage(msg),
          );
          preApproveTx = allowance.approveTx;
          if (preApproveTx) {
            collected.push(scanStep("Approve USDC", preApproveTx, signChainId));
            setMessage(
              `Step 2/${testnetWalletSteps} done · approved ${amount} USDC for CCTP`,
            );
          }
        }

        setStep(`3/${testnetWalletSteps} · Bridge burn`);
        setMessage(
          `Step 3/${testnetWalletSteps}: confirm bridge burn on ${signLabel} in your wallet`,
        );

        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const { result, capture } = await executeCircleBridge(
          kit,
          {
            from: { adapter, chain: fromChain as never },
            to: getBridgeDestination(toChain, adapter, network, recipient) as never,
            amount,
            config: getBridgeKitConfig(),
            token: "USDC",
          },
          (msg) => {
            if (msg.toLowerCase().includes("burn")) {
              setStep(`3/${testnetWalletSteps} · Bridge burn`);
            }
            setMessage(msg);
          },
          { preApproved: Boolean(preApproveTx) },
        );
        const captureMerged = {
          ...capture,
          approveTx: preApproveTx ?? capture.approveTx,
          approveBundled: false,
        };
        const submitted = bridgeSubmitStatus(
          typeof result.state === "string" ? result.state : undefined,
          Boolean(captureMerged.burnTx),
        );
        const bridgeScans = buildBridgeScanSteps(
          collected,
          captureMerged,
          result,
          fromChain,
          toChain,
          signChainId,
        );
        publishScans(bridgeScans, {
          type: "bridge",
          status: submitted.uiStatus,
          summary: `${fromMeta?.label}→${toMeta?.label}`,
          feeUsd: "Arc USDC",
          hash: captureMerged.burnTx ?? captureMerged.approveTx,
        });
        setStatus(submitted.uiStatus);
        setStep(null);
        setMessage(submitted.label);
      } else if (route.kind === "compound-swap-bridge") {
        setMessage("Step A: swap to USDC on source chain…");
        const cfg = getSwapChain(fromChain);
        let usdcAmount = amount;
        const stepA: TxScanStep[] = [];
        if (cfg) {
          const qs = new URLSearchParams({
            chainId: String(cfg.lifiChainId),
            tokenIn: fromToken,
            tokenOut: "USDC",
            amount,
          });
          const res = await fetch(`/api/uniswap/quote?${qs}`);
          const data = await res.json();
          if (res.ok) {
            const quote = uniswapQuoteFromApi(data);
            const { swapHash, approveHash } = await executeUniswapV3Swap(
              quote,
              getAddress(address),
              (msg) => setMessage(`Step A: ${msg}`),
            );
            if (approveHash) {
              stepA.push(scanStep("Approve USDC", approveHash, cfg.lifiChainId));
            }
            stepA.push(scanStep("Swap to USDC", swapHash, cfg.lifiChainId));
            usdcAmount = (Number(quote.amountOut) / 10 ** 6).toFixed(6);
          } else {
            const swapData = await fetchLifi(fromChain, fromChain, fromToken, "USDC", amount);
            const h = await sendLifi(swapData, signChainId);
            stepA.push(scanStep("Swap to USDC", h, signChainId));
          }
        } else {
          const swapData = await fetchLifi(fromChain, fromChain, fromToken, "USDC", amount);
          const h = await sendLifi(swapData, signChainId);
          stepA.push(scanStep("Swap to USDC", h, signChainId));
        }
        let preApproveTx: string | undefined;
        setStep(`2/${testnetWalletSteps} · Approve USDC`);
        const allowance = await ensureCctpUsdcAllowance(
          address,
          fromChain,
          usdcAmount,
          (msg) => setMessage(`Step B: ${msg}`),
        );
        preApproveTx = allowance.approveTx;
        if (preApproveTx) {
          stepA.push(scanStep("Approve USDC (CCTP)", preApproveTx, signChainId));
        }

        setStep(`3/${testnetWalletSteps} · Bridge burn`);
        setMessage(`Step B: confirm USDC bridge burn on ${signLabel}…`);
        installCircleProxyFetch();
        const { AppKit } = await import("@circle-fin/app-kit");
        const kit = new AppKit();
        const { result, capture } = await executeCircleBridge(
          kit,
          {
            from: { adapter, chain: fromChain as never },
            to: getBridgeDestination(TESTNET_HOME_CHAIN, adapter, network, recipient) as never,
            amount: usdcAmount,
            config: getBridgeKitConfig(),
            token: "USDC",
          },
          (msg) => {
            if (msg.toLowerCase().includes("burn")) {
              setStep(`3/${testnetWalletSteps} · Bridge burn`);
            }
            setMessage(`Step B: ${msg}`);
          },
          { preApproved: Boolean(preApproveTx) },
        );
        const captureMerged = {
          ...capture,
          approveTx: preApproveTx ?? capture.approveTx,
        };
        const allSteps = mergeScanSteps(
          collected,
          stepA,
          buildBridgeScanSteps(
            [],
            captureMerged,
            result,
            fromChain,
            TESTNET_HOME_CHAIN,
            signChainId,
          ),
        );
        publishScans(allSteps, {
          type: "bridge",
          status: "success",
          summary: `${fromToken}→Arc`,
          feeUsd: "Arc USDC",
          hash: capture.burnTx,
        });
        setStatus("success");
        setStep(null);
        setMessage(`Done · ${fromToken}→USDC→Arc`);
      } else {
        setMessage(`Confirm ${route.label} on ${signLabel}…`);
        const data = await fetchLifi(fromChain, toChain, fromToken, toToken, amount);
        const hash = await sendLifi(data, signChainId);
        const steps = mergeScanSteps(collected, [
          scanStep(route.label, hash, signChainId),
        ]);
        publishScans(steps, {
          type: fromChain === toChain ? "swap" : "bridge",
          status: "success",
          summary: `${fromToken}→${toToken} · ${hash.slice(0, 10)}`,
          feeUsd: "Arc USDC",
          hash,
        });
        setStatus("success");
        setStep(null);
        setMessage(`Submitted · ${hash.slice(0, 10)}… · Arc fee already paid`);
      }
    } catch (e) {
      setStep(null);
      if (collected.length > 0) setScanSteps(mergeScanSteps(collected));
      if (cancelRef.current) {
        setStatus("error");
        setMessage("Cancelled.");
      } else if (isUserRejected(e)) {
        setStatus("error");
        setMessage("Cancelled in wallet.");
      } else {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Failed");
      }
    }
  }, [
    isConnected,
    address,
    needsSwitch,
    signChainId,
    switchChain,
    amount,
    route,
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromTokenMeta,
    toTokenMeta,
    kitKey,
    network,
    recipient,
    fromMeta,
    toMeta,
    isTestnet,
    getAdapter,
    chains,
    chainId,
  ]);

  const pct = (p: number) => {
    const row = balances.find(
      (b) => b.chain === fromChain && b.symbol.toUpperCase() === fromToken.toUpperCase(),
    );
    if (row && fromTokenMeta && row.balanceRaw !== "0") {
      const raw = BigInt(row.balanceRaw);
      const slice = (raw * BigInt(Math.floor(p * 10000))) / BigInt(10000);
      const human = formatUnits(slice, fromTokenMeta.decimals);
      const n = parseFloat(human);
      setAmount(n < 1e-8 ? "0" : String(Number(n.toPrecision(8))));
      setQuoteOut(null);
      return;
    }
    const v = parseFloat(amount || "0");
    if (!v) return;
    setAmount(String(v * p));
  };

  return (
    <>
      <div className="exchange-widget mx-auto w-full max-w-md">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="font-display text-base font-bold text-white sm:text-lg">
            Swap & Bridge
          </h2>
          <div className="flex gap-1 text-slate-500">
            <Settings2 className="h-4 w-4 opacity-40" />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <button
            type="button"
            onClick={() => setPicker("from")}
            className="exchange-tile rounded-2xl p-3 text-left transition hover:border-violet-500/40 touch-manipulation"
          >
            <p className="text-[10px] text-slate-500">From</p>
            <div className="mt-2 flex items-center gap-2">
              <TokenAvatar symbol={fromToken} chainKey={fromChain} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-white">{fromToken}</p>
                <p className="truncate text-xs text-slate-400">{fromMeta?.label}</p>
                <TokenBalanceLine
                  chain={fromChain}
                  symbol={fromToken}
                  balances={balances}
                  loading={balancesLoading}
                />
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={swapEnds}
            className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800/80 text-slate-300 hover:text-cyan-300 touch-manipulation md:mx-0 md:self-center"
            aria-label="Swap from and to"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setPicker("to")}
            className="exchange-tile rounded-2xl p-3 text-left transition hover:border-violet-500/40 touch-manipulation"
          >
            <p className="text-[10px] text-slate-500">To</p>
            <div className="mt-2 flex items-center gap-2">
              <TokenAvatar symbol={toToken} chainKey={toChain} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-white">{toToken}</p>
                <p className="truncate text-xs text-slate-400">{toMeta?.label}</p>
                <TokenBalanceLine
                  chain={toChain}
                  symbol={toToken}
                  balances={balances}
                  loading={balancesLoading}
                />
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
            </div>
          </button>
        </div>

        <div className="exchange-tile mt-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500">Send</p>
            <TokenBalanceLine
              chain={fromChain}
              symbol={fromToken}
              balances={balances}
              loading={balancesLoading}
            />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <TokenAvatar symbol={fromToken} chainKey={fromChain} size={44} />
            <input
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuoteOut(null);
                setScanSteps([]);
                if (status !== "loading") {
                  setStatus("idle");
                  setMessage(null);
                }
              }}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-2xl font-semibold text-white outline-none sm:text-3xl"
            />
          </div>
          <div className="mt-3 flex gap-2">
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pct(p)}
                className="rounded-lg bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                {p === 1 ? "MAX" : `${p * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {status !== "success" && (
          <FeePreviewPanel preview={gasPreview} loading={gasPreviewLoading} />
        )}

        {walletProgressSteps.length > 0 && (
          <WalletStepsProgress steps={walletProgressSteps} />
        )}

        {quoteOut && !quoteLoading && status !== "success" && (
          <p className="mt-2 text-center text-xs text-emerald-300/80">
            Receive → {quoteOut}
          </p>
        )}

        {message && status === "error" && (
          <p className="mt-2 rounded-lg bg-rose-950/40 px-2 py-1.5 text-center text-xs text-rose-200">
            {message}
          </p>
        )}

        {message && status !== "success" && status !== "error" && (
          <p className="mt-2 text-center text-xs text-slate-400">{message}</p>
        )}

        {status === "loading" && step && !walletProgressSteps.length && (
          <p className="mt-2 text-center text-sm font-medium text-cyan-200/90">{step}</p>
        )}

        {status === "success" && (
          <div className="mt-2 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-3 py-2">
            <p className="text-sm font-semibold text-emerald-200">Transaction successful</p>
            {quoteOut && (
              <p className="text-xs text-emerald-300/80">Receive → {quoteOut}</p>
            )}
            {message && (
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{message}</p>
            )}
          </div>
        )}

        {(scanSteps.length > 0 ||
          (address && (status === "success" || status === "error"))) &&
          status !== "loading" && (
          <TxScannerPanel
            walletAddress={address}
            walletChainIds={walletChainIds}
            steps={scanSteps}
            variant={status === "success" ? "compact" : "result"}
          />
        )}

        {needsSwitch && isConnected && status !== "loading" && (
          <button
            type="button"
            disabled={switching}
            onClick={async () => {
              try {
                await switchWalletToChain(signChainId);
                switchChain({ chainId: signChainId });
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Switch failed");
                setStatus("error");
              }
            }}
            className="mt-3 w-full rounded-xl border border-amber-500/40 py-2 text-xs font-semibold text-amber-100"
          >
            {switching
              ? "Switching…"
              : `Switch to ${chains.find((c) => c.appKitChain === route?.signChain)?.label ?? "source"}`}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowRecipient(!showRecipient)}
          className="mt-2 w-full text-center text-[10px] text-slate-500 hover:text-cyan-400"
        >
          {showRecipient ? "Hide" : "Send to another wallet"}
        </button>
        {showRecipient && (
          <div className="mt-2">
            <RecipientField value={recipient} onChange={setRecipient} />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void runQuote(true)}
            disabled={status === "loading" || quoteLoading}
            className="btn-secondary min-h-[48px] flex-1 py-3 text-sm disabled:opacity-50 touch-manipulation"
          >
            {quoteLoading ? "…" : "Quote"}
          </button>
          <button
            type="button"
            onClick={runExchange}
            disabled={status === "loading"}
            className="btn-primary min-h-[48px] flex-[2] rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-70 touch-manipulation"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {step ?? "Working…"}
              </span>
            ) : (
              <>
                Exchange <ArrowRight className="ml-1 inline h-4 w-4" />
              </>
            )}
          </button>
          {status === "loading" && (
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true;
                setStatus("error");
                setStep(null);
                setMessage("Cancelled.");
              }}
              className="text-xs text-slate-400 underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {picker && (
        <TokenPicker
          title={picker === "from" ? "Exchange from" : "Exchange to"}
          chains={chains}
          chainKey={picker === "from" ? fromChain : toChain}
          tokenSymbol={picker === "from" ? fromToken : toToken}
          onSelect={(chain, token) => {
            if (picker === "from") {
              setFromChain(chain);
              setFromToken(token);
            } else {
              setToChain(chain);
              setToToken(token);
            }
            setQuoteOut(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}

declare global {
  interface Window {
    ethereum?: unknown;
  }
}
