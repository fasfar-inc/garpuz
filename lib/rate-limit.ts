import "server-only";

export type RateLimiterName = "SEARCH_RATE_LIMITER" | "CONTACT_RATE_LIMITER";

/** Requests allowed per client IP per minute. */
const LIMITS: Record<RateLimiterName, number> = { SEARCH_RATE_LIMITER: 60, CONTACT_RATE_LIMITER: 20 };
const WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 10_000;

/**
 * The client IP as Vercel reports it. Vercel sets `x-real-ip` and overwrites
 * `x-forwarded-for`, so neither can be spoofed by the visitor on Vercel deployments.
 */
export function clientKey(headers: Headers) {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const windows = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window limit kept in memory. Vercel reuses function instances across requests, so this
 * stops floods from one client; it is per instance, not global. For a hard global limit add a
 * Vercel Firewall rate-limit rule on /search and /api/ (see README).
 */
export async function allowRequest(name: RateLimiterName, key: string) {
  const now = Date.now();
  const id = `${name}:${key}`;
  const current = windows.get(id);
  if (!current || current.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_CLIENTS) {
      for (const [entry, value] of windows) if (value.resetAt <= now) windows.delete(entry);
      if (windows.size >= MAX_TRACKED_CLIENTS) windows.clear();
    }
    windows.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= LIMITS[name];
}
