import { describe, expect, it, vi } from "vitest";
import { assertQueries, describeKey, explainFailure } from "@/lib/admin/diagnostics";

const jwt = (payload: object) => `x.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("describeKey", () => {
  it.each([
    [undefined, "missing"],
    ["sb_secret_abc", "secret"],
    ["sb_publishable_abc", "publishable"],
    [jwt({ role: "service_role" }), "legacy-jwt:service_role"],
    [jwt({ role: "anon" }), "legacy-jwt:anon"],
    ["not-a-key", "unrecognized"],
  ])("classifies %s as %s", (key, kind) => expect(describeKey(key)).toBe(kind));
});

describe("explainFailure", () => {
  it("points permission errors at the grants migration, including empty count responses", () => {
    expect(explainFailure({ error: { code: "42501", message: "permission denied for table merchants" }, status: 403 })).toMatch(/004_service_role_table_grants/);
    expect(explainFailure({ error: { message: "" }, status: 403 })).toMatch(/004_service_role_table_grants/);
  });
  it("points missing tables at the migrations", () => {
    expect(explainFailure({ error: { code: "PGRST205", message: "Could not find the table" }, status: 404 })).toMatch(/Apply every file/);
  });
});

describe("assertQueries", () => {
  it("does nothing when every query succeeded", () => {
    expect(() => assertQueries("overview", { a: { error: null, status: 200 } })).not.toThrow();
  });
  it("logs each failure and throws a message that names the query and status", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => assertQueries("overview", { ok: { error: null }, totalMerchants: { error: { message: "" }, status: 403, statusText: "Forbidden" } }))
      .toThrow('Admin query "totalMerchants" failed in overview (HTTP 403): Forbidden');
    expect(log).toHaveBeenCalledWith('[admin] overview: query "totalMerchants" failed', expect.objectContaining({ status: 403, fix: expect.stringMatching(/004/) }));
    log.mockRestore();
  });
});
