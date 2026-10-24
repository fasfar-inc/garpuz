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

/** The signed-in user and their shop, if any. Null when nobody is signed in or Supabase is not configured. */
export async function getSignedInShop() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("merchants").select(MERCHANT_COLUMNS).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return { supabase, user, merchant: data as MerchantProfile | null };
}

/** Loads the signed-in user's shop, sending anyone without one to sign in or create a shop. */
export async function requireMerchant() {
  const session = await getSignedInShop();
  if (!session?.merchant) redirect("/business/register");
  return { ...session, merchant: session.merchant };
}
