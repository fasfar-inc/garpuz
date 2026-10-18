import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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

export async function requireAdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/unauthorized?reason=configuration");
  const { data: { user } } = await supabase.auth.getUser();
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
