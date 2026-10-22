import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { describeKey } from "@/lib/admin/diagnostics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export function hasAdminRole(user: User) {
  return user.app_metadata?.role === "admin";
}

export async function getVerifiedAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !hasAdminRole(user)) return null;
  return user;
}

/**
 * Returns a problem with the server-side Supabase configuration, or null. Only variable
 * names and the kind of key are reported, never their values.
 */
export function adminConfigurationProblem() {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((name) => !process.env[name]);
  if (missing.length) return `Missing environment variables: ${missing.join(", ")}`;
  const kind = describeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  // A public key here makes every admin query run as anon and fail with "permission denied".
  if (kind === "publishable" || kind === "legacy-jwt:anon" || kind === "legacy-jwt:authenticated") {
    return `SUPABASE_SERVICE_ROLE_KEY holds a public key (${kind}); it must be the service_role or secret key`;
  }
  return null;
}

export async function requireAdminPage() {
  const problem = adminConfigurationProblem();
  if (problem) {
    console.error(`[admin] configuration: ${problem}`);
    redirect("/unauthorized?reason=configuration");
  }
  const supabase = await createClient();
  if (!supabase) redirect("/unauthorized?reason=configuration");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") console.error("[admin] session check failed", { status: error.status, code: error.code, message: error.message });
  if (!user) redirect("/unauthorized?reason=signin");
  if (!hasAdminRole(user)) redirect("/unauthorized?reason=forbidden");
  const admin = createAdminClient();
  if (!admin) redirect("/unauthorized?reason=configuration");
  return { user, admin };
}

export async function requireAdminMutation() {
  const user = await getVerifiedAdmin();
  if (!user) throw new Error("Unauthorized administrator action");
  const admin = createAdminClient();
  if (!admin) throw new Error("Admin database client is not configured");
  return { user, admin };
}
