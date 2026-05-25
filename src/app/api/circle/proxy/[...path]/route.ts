import { NextRequest, NextResponse } from "next/server";
import { getKitKey } from "@/lib/circle";

const CIRCLE_API = "https://api.circle.com";

/**
 * Proxies Circle Stablecoin Kit API calls from the browser (avoids CORS on api.circle.com).
 * Injects server-side KIT_KEY — do not rely on exposing secrets in the client.
 */
async function proxy(req: NextRequest, pathSegments: string[]) {
  const kitKey = getKitKey();
  if (!kitKey) {
    return NextResponse.json(
      { error: "CIRCLE_KIT_KEY or NEXT_PUBLIC_CIRCLE_KIT_KEY not configured" },
      { status: 503 },
    );
  }

  const path = pathSegments.join("/");
  const target = `${CIRCLE_API}/${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${kitKey}`,
  };

  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
