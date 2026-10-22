import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RateLimiterName = "SEARCH_RATE_LIMITER" | "CONTACT_RATE_LIMITER";

export function clientKey(headers: Headers) {
  return headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Uses the Workers rate limiting binding declared in wrangler.jsonc. When the binding is
 * unavailable (plain `next start`, tests) requests are allowed so the site keeps working.
 */
export async function allowRequest(name: RateLimiterName, key: string) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const limiter: RateLimit | undefined = env[name];
    if (!limiter) return true;
    return (await limiter.limit({ key })).success;
  } catch {
    return true;
  }
}
