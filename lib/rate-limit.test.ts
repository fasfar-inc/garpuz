import { describe, expect, it } from "vitest";
import { allowRequest, clientKey } from "@/lib/rate-limit";

describe("allowRequest", () => {
  it("allows up to the limit per client and window, then refuses", async () => {
    const results = [];
    for (let i = 0; i < 21; i++) results.push(await allowRequest("CONTACT_RATE_LIMITER", "203.0.113.7"));
    expect(results.filter(Boolean)).toHaveLength(20);
    expect(results[20]).toBe(false);
    // Another client and another limiter are counted separately.
    expect(await allowRequest("CONTACT_RATE_LIMITER", "203.0.113.8")).toBe(true);
    expect(await allowRequest("SEARCH_RATE_LIMITER", "203.0.113.7")).toBe(true);
  });
});

describe("clientKey", () => {
  it("prefers Vercel's x-real-ip, then the first x-forwarded-for entry", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.1", "x-forwarded-for": "10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientKey(new Headers({ "x-forwarded-for": "198.51.100.2, 10.0.0.1" }))).toBe("198.51.100.2");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
