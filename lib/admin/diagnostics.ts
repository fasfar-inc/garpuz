import "server-only";

/** The parts of a Supabase query result that explain a failure. */
type QueryResult = {
  error: { message?: string; code?: string; details?: string | null; hint?: string | null } | null;
  status?: number;
  statusText?: string;
};

/**
 * Classifies a server key without revealing it: new-style keys by prefix, legacy JWT keys
 * by their `role` claim. Only the classification is ever logged.
 */
export function describeKey(key: string | undefined) {
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8")).role;
    return typeof role === "string" ? `legacy-jwt:${role}` : "unrecognized";
  } catch {
    return "unrecognized";
  }
}

/** Suggests the most likely fix for a failed admin query. */
export function explainFailure({ error, status }: QueryResult) {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();
  if (code === "42501" || message.includes("permission denied") || (status === 403 && !code)) {
    return "The database refused the service role. Apply supabase/migrations/004_service_role_table_grants.sql, and check that SUPABASE_SERVICE_ROLE_KEY holds the service_role or secret key (not the anon/publishable key).";
  }
  if (code === "PGRST205" || code === "42P01" || message.includes("schema cache")) {
    return "A table is missing. Apply every file in supabase/migrations in order.";
  }
  if (code === "PGRST202" || code === "42883") return "A database function is missing. Apply every file in supabase/migrations in order.";
  if (status === 401 || code === "PGRST301" || message.includes("api key") || message.includes("jwt")) {
    return "Supabase rejected the server key. Check SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL belong to the same project, and that legacy keys are enabled if a legacy JWT key is used.";
  }
  return "Unexpected Supabase error.";
}

/**
 * Logs every failed query with its PostgREST code, status and a suggested fix, then throws.
 * Count queries (`head: true`) return an empty message, so the status is what identifies them.
 */
export function assertQueries(scope: string, results: Record<string, QueryResult>) {
  const failed = Object.entries(results).filter(([, result]) => result.error);
  if (!failed.length) return;
  for (const [label, result] of failed) {
    console.error(`[admin] ${scope}: query "${label}" failed`, {
      status: result.status,
      code: result.error?.code || null,
      message: result.error?.message || result.statusText || null,
      details: result.error?.details ?? null,
      hint: result.error?.hint ?? null,
      fix: explainFailure(result),
    });
  }
  const [label, first] = failed[0];
  throw new Error(`Admin query "${label}" failed in ${scope} (${first.error?.code || `HTTP ${first.status ?? "?"}`}): ${first.error?.message || first.statusText || "no message"}`);
}
