import { connection } from "next/server";
import { getContactProvider } from "@/lib/contact/delivery";
import { HONEYPOT_FIELD, MIN_FILL_MS, validateContact, type ContactResponse } from "@/lib/contact/schema";

/**
 * The contact API. GET reports whether delivery is configured (a boolean,
 * nothing more). POST validates, filters spam, rate-limits and hands the
 * inquiry to the configured provider; it answers `ok: true` only once the
 * provider has accepted it.
 */
const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

// Per-instance, best-effort limit. Behind several instances, add a shared
// store (or the platform's rate limiting) in front of this route.
const hits = new Map<string, number[]>();

const json = (body: ContactResponse | { available: boolean }, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.size > 5000) hits.clear();
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  hits.set(key, [...recent, now]);
  return false;
}

/** Only accept posts from this site's own pages. */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

export async function GET() {
  await connection();
  return json({ available: getContactProvider() !== null });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ ok: false, error: "rejected" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ ok: false, error: "rejected" }, 415);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "rejected" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "rejected" }, 400);
  }

  // Spam: a field people never see must stay empty, and the form can't be filled in instantly.
  const elapsed = Date.now() - Number(body.startedAt);
  if (body[HONEYPOT_FIELD] || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return json({ ok: false, error: "rejected" }, 400);
  }

  const result = validateContact(body);
  if (!result.ok) return json({ ok: false, error: "invalid", errors: result.errors }, 422);

  const provider = getContactProvider();
  if (!provider) return json({ ok: false, error: "unavailable" }, 503);

  if (rateLimited(clientKey(request))) return json({ ok: false, error: "rate_limited" }, 429);

  try {
    await provider.send({ ...result.data, receivedAt: new Date().toISOString() });
  } catch (error) {
    // Log the failure, never the visitor's message.
    console.error(`Contact delivery via ${provider.name} failed:`, error instanceof Error ? error.message : error);
    return json({ ok: false, error: "delivery_failed" }, 502);
  }
  return json({ ok: true });
}
