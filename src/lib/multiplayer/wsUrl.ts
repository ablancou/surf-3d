/** Resolves WebSocket URL for local dev and production (Fly.io / custom host). */
export function resolveWsUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "ws://localhost:3001";
    }
    if (hostname.includes("surf-3d")) {
      return "wss://surf-3d-ws.fly.dev";
    }
  }

  return "ws://localhost:3001";
}