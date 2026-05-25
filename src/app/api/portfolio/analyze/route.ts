import { NextRequest, NextResponse } from "next/server";

/** Legacy route — delegates to dashboard aggregator. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dashboardUrl = new URL("/api/dashboard", url.origin);
  dashboardUrl.search = url.search;
  const res = await fetch(dashboardUrl.toString(), {
    headers: req.headers,
  });
  const json = await res.json();
  if (!json.analysis) {
    return NextResponse.json(
      { error: json.hint ?? json.error ?? "No portfolio data" },
      { status: json.hint ? 200 : 502 },
    );
  }
  return NextResponse.json({
    analysis: json.analysis,
    topPositions: json.topPositions,
  });
}
