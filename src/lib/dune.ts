export type PortfolioDuneAnalytics = {
  source: "dune";
  queryId?: string;
  executionId?: string;
  rows: Array<Record<string, unknown>>;
  summary: {
    label: string;
    value: string;
  }[];
  fetchedAt: string;
};

export function isDuneConfigured(): boolean {
  return Boolean(process.env.DUNE_API_KEY?.trim());
}

function duneHeaders(): HeadersInit {
  const key = process.env.DUNE_API_KEY?.trim();
  if (!key) throw new Error("DUNE_API_KEY is not configured");
  return {
    "content-type": "application/json",
    "X-Dune-API-Key": key,
  };
}

async function executeQuery(
  queryId: string,
  params?: Record<string, string | number>,
): Promise<string | null> {
  const res = await fetch(`https://api.dune.com/api/v1/query/${queryId}/execute`, {
    method: "POST",
    headers: duneHeaders(),
    body: JSON.stringify(
      params
        ? {
            query_parameters: Object.entries(params).map(([key, value]) => ({
              key,
              value: String(value),
              type: "text",
            })),
          }
        : {},
    ),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { execution_id?: string };
  return json.execution_id ?? null;
}

async function pollResults(
  executionId: string,
  attempts = 8,
): Promise<Array<Record<string, unknown>>> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 800 + i * 400));

    const res = await fetch(
      `https://api.dune.com/api/v1/execution/${executionId}/results`,
      { headers: duneHeaders(), cache: "no-store" },
    );

    if (!res.ok) continue;

    const json = (await res.json()) as {
      state?: string;
      result?: { rows?: Array<Record<string, unknown>> };
    };

    if (json.state === "QUERY_STATE_COMPLETED") {
      return json.result?.rows ?? [];
    }
    if (json.state === "QUERY_STATE_FAILED") break;
  }
  return [];
}

export function buildLivePortfolioAnalytics(input: {
  totalUsd: number;
  assetCount: number;
  txCount: number;
  chainCount: number;
  spamCount: number;
  sources: string[];
}): PortfolioDuneAnalytics {
  return {
    source: "dune",
    rows: [],
    summary: [
      { label: "Net worth", value: `$${input.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
      { label: "Tokens tracked", value: String(input.assetCount) },
      { label: "Transactions", value: String(input.txCount) },
      { label: "Active chains", value: String(input.chainCount) },
      { label: "Flagged (GoPlus)", value: String(input.spamCount) },
      { label: "Live sources", value: input.sources.slice(0, 4).join(" · ") || "—" },
    ],
    fetchedAt: new Date().toISOString(),
  };
}

/** Optional Dune query — set DUNE_PORTFOLIO_QUERY_ID on Vercel with a wallet analytics query. */
export async function fetchPortfolioDuneAnalytics(
  address: string,
  liveFallback?: Omit<Parameters<typeof buildLivePortfolioAnalytics>[0], never>,
): Promise<PortfolioDuneAnalytics | null> {
  if (!isDuneConfigured()) return null;

  const queryId = process.env.DUNE_PORTFOLIO_QUERY_ID?.trim();
  if (!queryId) {
    if (liveFallback) {
      return buildLivePortfolioAnalytics(liveFallback);
    }
    return {
      source: "dune",
      rows: [],
      summary: [{ label: "Dune", value: "Connected — sync portfolio for live stats" }],
      fetchedAt: new Date().toISOString(),
    };
  }

  const executionId = await executeQuery(queryId, { wallet: address });
  if (!executionId) return null;

  const rows = await pollResults(executionId);
  const summary = rows.slice(0, 4).map((row, idx) => {
    const keys = Object.keys(row);
    const k = keys[0] ?? `metric_${idx}`;
    return {
      label: String(k),
      value: String(row[k] ?? "—"),
    };
  });

  return {
    source: "dune",
    queryId,
    executionId,
    rows,
    summary,
    fetchedAt: new Date().toISOString(),
  };
}
