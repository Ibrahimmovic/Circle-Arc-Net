import { fetchLifiQuote, type LifiQuoteResult } from "@/lib/lifi";

const LIFI_BASE = "https://li.quest/v1";

export type RouteBadge = "best" | "fastest" | "direct";

export interface CrossChainRouteOption {
  id: string;
  badge: RouteBadge;
  provider: string;
  title: string;
  toAmount?: string;
  toAmountUsd?: string;
  gasUsd?: string;
  durationSec?: number;
  /** LI.FI executable */
  lifiQuote?: LifiQuoteResult;
  /** Circle CCTP — no single tx; user runs guided flow */
  circleDirect?: boolean;
  executable: boolean;
  hint?: string;
  /** How this path fulfills the user goal */
  executionHint?: string;
  toAmountDisplay?: string;
  toAmountDecimals?: number;
}

interface LifiAdvancedRoute {
  id: string;
  tags?: string[];
  steps?: unknown[];
  toAmount?: string;
  toAmountMin?: string;
  gasCostUSD?: string;
  executionDuration?: number;
  tool?: string;
  toolDetails?: { name?: string };
}

function badgeFromTags(tags: string[] | undefined): RouteBadge {
  if (tags?.includes("FASTEST")) return "fastest";
  if (tags?.includes("CHEAPEST") || tags?.includes("RECOMMENDED")) return "best";
  return "best";
}

function providerName(route: LifiAdvancedRoute): string {
  return route.toolDetails?.name ?? route.tool ?? "LI.FI";
}

function dedupeRoutes(options: CrossChainRouteOption[]): CrossChainRouteOption[] {
  const seen = new Set<string>();
  const out: CrossChainRouteOption[] = [];
  for (const o of options) {
    const key = `${o.provider}:${o.toAmount ?? ""}:${o.badge}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out.slice(0, 3);
}

/** Fetch multiple LI.FI routes, fallback to single quote. */
export async function fetchCrossChainRoutes(params: {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress?: string;
  executionHint?: string;
}): Promise<CrossChainRouteOption[]> {
  const hint =
    params.executionHint ??
    "Single signature · orchestrated bridge + swap + delivery";
  const body = {
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    fromTokenAddress: params.fromToken,
    toTokenAddress: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress ?? params.fromAddress,
    options: {
      slippage: 0.03,
      integrator: "agora-forge",
      order: "RECOMMENDED",
    },
  };

  try {
    const res = await fetch(`${LIFI_BASE}/advanced/routes`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      routes?: LifiAdvancedRoute[];
      message?: string;
    };
    if (res.ok && data.routes?.length) {
      const seen = new Set<string>();
      const options: CrossChainRouteOption[] = [];
      for (const r of data.routes.slice(0, 4)) {
        const provider = providerName(r);
        if (seen.has(provider)) continue;
        seen.add(provider);
        const badge = badgeFromTags(r.tags);
        options.push({
          id: r.id ?? `lifi-${provider}`,
          badge: options.length === 0 ? "best" : badge,
          provider,
          title: provider,
          toAmount: r.toAmountMin ?? r.toAmount,
          gasUsd: r.gasCostUSD,
          durationSec: r.executionDuration,
          executable: true,
          hint,
          executionHint: hint,
        });
      }
      if (options.length) {
        const fastest = data.routes.find((r) => r.tags?.includes("FASTEST"));
        if (fastest && !options.some((o) => o.badge === "fastest")) {
          options.push({
            id: fastest.id ?? "lifi-fast",
            badge: "fastest",
            provider: providerName(fastest),
            title: providerName(fastest),
            toAmount: fastest.toAmountMin ?? fastest.toAmount,
            gasUsd: fastest.gasCostUSD,
            durationSec: fastest.executionDuration,
            executable: true,
            hint: "Lowest latency path",
            executionHint: "Lowest latency path",
          });
        }
        return dedupeRoutes(options);
      }
    }
  } catch {
    /* fallback below */
  }

  try {
    const quote = await fetchLifiQuote({
      fromChain: params.fromChainId,
      toChain: params.toChainId,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
    });
    const hasTx = Boolean(
      quote.transactionRequest?.to && quote.transactionRequest?.data,
    );
    return [
      {
        id: "lifi-primary",
        badge: "best",
        provider: quote.tool ?? "LI.FI",
        title: quote.tool ?? "Aggregated route",
        toAmount: quote.estimate?.toAmountMin ?? quote.estimate?.toAmount,
        executable: hasTx,
        lifiQuote: quote,
        hint: hasTx ? hint : "Quote only — adjust amount",
        executionHint: hint,
      },
    ];
  } catch (e) {
    return [
      {
        id: "none",
        badge: "best",
        provider: "—",
        title: "No route",
        executable: false,
        hint: e instanceof Error ? e.message : "Try another pair or amount",
      },
    ];
  }
}
