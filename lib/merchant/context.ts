import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MerchantRow } from "@/lib/admin/types";

/**
 * The signed-in shop owner and their shop. Reads go through the user's own
 * Supabase session, so row-level security limits them to this shop's data.
 * Cached per request so the layout and page share one lookup.
 */
export const requireMerchant = cache(async () => {
  const supabase = await createClient();
  if (!supabase) redirect("/business/register");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/register");
  const { data, error } = await supabase.from("merchants").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) redirect("/business/setup");
  return { supabase, user, merchant: data as MerchantRow };
});

export function isSearchReady(merchant: Pick<MerchantRow, "whatsapp" | "city">) {
  return Boolean(merchant.whatsapp && merchant.city);
}

export type SaveResult = { row: number; status: "created" | "updated" | "failed"; error?: string; offer_id?: string };
