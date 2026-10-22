import { NextResponse } from "next/server";
import { adminConfigurationProblem, getVerifiedAdmin } from "@/lib/admin/auth";
import { describeKey, explainFailure } from "@/lib/admin/diagnostics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Tables each migration creates, read with the service role exactly as the admin pages do.
const TABLES = {
  "001": ["merchants", "canonical_products", "merchant_offers"],
  "002": ["admin_audit_logs", "search_events", "whatsapp_contact_clicks"],
} as const;

/**
 * Admin-only diagnostics for the admin dashboard's Supabase setup. Reports which checks
 * fail and why, never secrets. Anyone else gets a 404 so the endpoint reveals nothing.
 */
export async function GET() {
  const user = await getVerifiedAdmin();
  if (!user) return new NextResponse(null, { status: 404 });

  const checks: { name: string; ok: boolean; status?: number; code?: string | null; message?: string | null; fix?: string }[] = [];
  const record = (name: string, result: { error: { message?: string; code?: string } | null; status?: number; statusText?: string }) => {
    checks.push(result.error
      ? { name, ok: false, status: result.status, code: result.error.code || null, message: result.error.message || result.statusText || null, fix: explainFailure(result) }
      : { name, ok: true, status: result.status });
  };

  const admin = createAdminClient();
  if (admin) {
    for (const [migration, tables] of Object.entries(TABLES)) {
      for (const table of tables) record(`${migration}: service role reads ${table}`, await admin.from(table).select("*", { count: "exact", head: true }));
    }
  }
  // The facets function from migration 003 is granted to signed-in users, not the service role.
  const supabase = await createClient();
  if (supabase) record("003: search_public_offer_facets", await supabase.rpc("search_public_offer_facets", { search_query: "health" }));

  const problem = adminConfigurationProblem();
  const body = {
    ok: !problem && checks.length > 0 && checks.every((check) => check.ok),
    configuration: {
      problem,
      supabaseHost: (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; } catch { return null; } })(),
      serviceKey: describeKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
      anonKey: describeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    checks,
  };
  if (!body.ok) console.error("[admin] health check failed", JSON.stringify(body));
  return NextResponse.json(body, { status: body.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
