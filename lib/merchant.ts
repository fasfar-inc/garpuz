import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MerchantStatus } from "@/lib/admin/types";

export type MerchantProfile = {
  id: string; business_name: string; representative_name: string | null; email: string;
  phone: string | null; whatsapp: string | null; category: string; city: string | null;
  address: string | null; website: string | null; registration_number: string | null;
  verification_document_path: string | null; status: MerchantStatus;
};

const MERCHANT_COLUMNS = "id,business_name,representative_name,email,phone,whatsapp,category,city,address,website,registration_number,verification_document_path,status";

/** Loads the signed-in user's shop, redirecting to sign-in or shop setup when either is missing. */
export async function requireMerchant() {
  const supabase = await createClient();
  if (!supabase) redirect("/business/register");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/register");
  const { data, error } = await supabase.from("merchants").select(MERCHANT_COLUMNS).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) redirect("/business/setup");
  return { supabase, user, merchant: data as MerchantProfile };
}
