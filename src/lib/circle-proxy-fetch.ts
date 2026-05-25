/** Route Circle Stablecoin Kit browser calls through our API (fixes CORS). */

const PREFIX = "https://api.circle.com/";

export function installCircleProxyFetch(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { __agoraCircleProxy?: boolean };
  if (w.__agoraCircleProxy) return;

  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : "";

    if (url.startsWith(PREFIX)) {
      const proxied = url.replace(PREFIX, "/api/circle/proxy/");
      if (input instanceof Request) {
        const initFromReq: RequestInit = {
          method: input.method,
          headers: input.headers,
          body: input.method !== "GET" && input.method !== "HEAD" ? await input.clone().arrayBuffer() : undefined,
          ...init,
        };
        return original(proxied, initFromReq);
      }
      return original(proxied, init);
    }

    return original(input, init);
  };

  w.__agoraCircleProxy = true;
}
