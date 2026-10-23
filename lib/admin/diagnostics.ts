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

/** The Supabase project a legacy JWT key belongs to (its `ref` claim); null for other key kinds. */
export function keyProjectRef(key: string | undefined) {
  if (!key || key.startsWith("sb_")) return null;
  try {
    const ref = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8")).ref;
    return typeof ref === "string" ? ref : null;
  } catch {
    return null;
  }
}

/** The project ref in a hosted Supabase URL (https://<ref>.supabase.co); null for custom domains. */
export function urlProjectRef(url: string | undefined) {
  try {
    const host = new URL(url ?? "").host;
    return host.endsWith(".supabase.co") ? host.split(".")[0] : null;
  } catch {
    return null;
  }
}

/**
 * The variables as the running build sees them. Direct references matter: Next.js inlines
 * NEXT_PUBLIC_* values at build time, and those inlined values are what the site uses, so a
 * dynamic `process.env[name]` lookup could report a runtime value the build never saw.
 */
function deploymentEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
}

/**
 * Checks the deployment's Supabase and site variables. Reports variable names and kinds of
 * key only, never values. `blocking` problems stop the admin dashboard from running.
 */
export function environmentProblems(env: Record<string, string | undefined> = deploymentEnv()) {
  const problems: { variable: string; problem: string; blocking: boolean }[] = [];
  for (const variable of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!env[variable]) problems.push({ variable, problem: "missing", blocking: true });
  }
  const serviceKind = describeKey(env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKind === "publishable" || serviceKind === "legacy-jwt:anon" || serviceKind === "legacy-jwt:authenticated") {
    problems.push({ variable: "SUPABASE_SERVICE_ROLE_KEY", problem: `holds a public key (${serviceKind}); use the service_role or secret key`, blocking: true });
  }
  // This variable is shipped to every browser, so a server secret here is a leak.
  const anonKind = describeKey(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (anonKind === "secret" || anonKind === "legacy-jwt:service_role") {
    problems.push({ variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY", problem: `holds a server secret (${anonKind}); replace it with the anon/publishable key and rotate the secret`, blocking: true });
  }
  const urlRef = urlProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  for (const variable of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    const ref = keyProjectRef(env[variable]);
    if (urlRef && ref && ref !== urlRef) problems.push({ variable, problem: "belongs to a different Supabase project than NEXT_PUBLIC_SUPABASE_URL", blocking: true });
  }
  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) problems.push({ variable: "NEXT_PUBLIC_SITE_URL", problem: "missing; canonical links, sitemap and social previews fall back to localhost", blocking: false });
  else if (env.VERCEL_ENV === "production") {
    try {
      const url = new URL(site);
      if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) problems.push({ variable: "NEXT_PUBLIC_SITE_URL", problem: "must be the https production origin", blocking: false });
    } catch {
      problems.push({ variable: "NEXT_PUBLIC_SITE_URL", problem: "is not a valid URL", blocking: false });
    }
  }
  return problems;
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
      hint: result.error?.hint ?? null,
      fix: explainFailure(result),
    });
  }
  const [label, first] = failed[0];
  throw new Error(`Admin query "${label}" failed in ${scope} (${first.error?.code || `HTTP ${first.status ?? "?"}`}): ${first.error?.message || first.statusText || "no message"}`);
}
