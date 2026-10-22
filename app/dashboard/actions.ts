"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { catalogKey, parseImport, type ImportProblem } from "@/lib/catalog-import";
import { requireMerchant } from "@/lib/merchant";
import { createAdminClient } from "@/lib/supabase/admin";
import { offerSchema, offerUpdateSchema, profileSchema } from "@/lib/validation";

const idSchema = z.string().uuid();

function invalid(path: string, error: z.ZodError): never {
  redirect(`${path}?error=invalid:${encodeURIComponent(String(error.issues[0]?.path[0] ?? "form"))}`);
}

function refreshDashboard() {
  revalidatePath("/dashboard", "layout");
}

export async function updateProfile(formData: FormData) {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid("/dashboard/profile", parsed.error);
  const { supabase, merchant } = await requireMerchant();
  const p = parsed.data;
  const payload: Record<string, string | null> = {
    business_name: p.businessName, representative_name: p.representativeName, phone: p.phone, whatsapp: p.whatsapp,
    city: p.city, address: p.address, website: p.website, updated_at: new Date().toISOString(),
  };
  // The database also enforces this: the registration number is locked once a shop has been reviewed.
  if (merchant.status === "pending" && p.registrationNumber !== undefined) payload.registration_number = p.registrationNumber;
  const { error } = await supabase.from("merchants").update(payload).eq("id", merchant.id);
  if (error) {
    console.error("Profile update failed", error.message);
    redirect(`/dashboard/profile?error=${error.code === "23505" ? "invalid:registrationNumber" : "failed"}`);
  }
  refreshDashboard();
  redirect("/dashboard/profile?notice=saved");
}

const DOCUMENT_TYPES: Record<string, { ext: string; magic: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
};
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export async function uploadVerificationDocument(formData: FormData) {
  const file = formData.get("document");
  const type = file instanceof File ? DOCUMENT_TYPES[file.type] : undefined;
  if (!(file instanceof File) || !type || file.size === 0 || file.size > MAX_DOCUMENT_BYTES) redirect("/dashboard/profile?error=documentInvalid");
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the file signature too, so a renamed executable cannot pose as a PDF or image.
  if (!type.magic.every((byte, i) => bytes[i] === byte)) redirect("/dashboard/profile?error=documentInvalid");

  const { merchant } = await requireMerchant();
  const admin = createAdminClient();
  if (!admin) redirect("/dashboard/profile?error=failed");
  const path = `${merchant.id}/${crypto.randomUUID()}.${type.ext}`;
  const { error: uploadError } = await admin.storage.from("business-verification").upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Verification upload failed", uploadError.message);
    redirect("/dashboard/profile?error=failed");
  }
  const { error } = await admin.from("merchants").update({ verification_document_path: path, updated_at: new Date().toISOString() }).eq("id", merchant.id);
  if (error) {
    await admin.storage.from("business-verification").remove([path]);
    redirect("/dashboard/profile?error=failed");
  }
  refreshDashboard();
  redirect("/dashboard/profile?notice=documentUploaded");
}

export async function createOffer(formData: FormData) {
  const back = `/dashboard/products${typeof formData.get("q") === "string" ? `?q=${encodeURIComponent(String(formData.get("q")))}&` : "?"}`;
  const parsed = offerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${back}error=invalid:${encodeURIComponent(String(parsed.error.issues[0]?.path[0] ?? "form"))}`);
  const { supabase, merchant } = await requireMerchant();
  const p = parsed.data;
  const { error } = await supabase.from("merchant_offers").insert({
    merchant_id: merchant.id, product_id: p.productId, price: p.price, currency: p.currency,
    condition: p.condition, availability: p.availability, merchant_sku: p.sku,
  });
  if (error) {
    if (error.code !== "23505") console.error("Offer creation failed", error.message);
    redirect(`${back}error=${error.code === "23505" ? "offerDuplicate" : "failed"}`);
  }
  refreshDashboard();
  redirect("/dashboard/products?notice=offerCreated");
}

export async function updateOffer(formData: FormData) {
  const parsed = offerUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid("/dashboard/products", parsed.error);
  const { supabase, merchant } = await requireMerchant();
  const { data, error } = await supabase.from("merchant_offers")
    .update({ price: parsed.data.price, availability: parsed.data.availability, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id).eq("merchant_id", merchant.id).select("id").maybeSingle();
  if (error || !data) redirect(`/dashboard/products?error=${error ? "failed" : "notFound"}`);
  refreshDashboard();
  redirect("/dashboard/products?notice=offerUpdated");
}

export async function setOfferVisibility(formData: FormData) {
  const parsed = z.object({ id: idSchema, active: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/dashboard/products?error=failed");
  const { supabase, merchant } = await requireMerchant();
  const { data, error } = await supabase.from("merchant_offers")
    .update({ is_active: parsed.data.active === "true", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id).eq("merchant_id", merchant.id).select("id").maybeSingle();
  if (error || !data) redirect(`/dashboard/products?error=${error ? "failed" : "notFound"}`);
  refreshDashboard();
  redirect("/dashboard/products?notice=offerUpdated");
}

export async function deleteOffer(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect("/dashboard/products?error=failed");
  const { supabase, merchant } = await requireMerchant();
  const { data, error } = await supabase.from("merchant_offers").delete().eq("id", parsed.data).eq("merchant_id", merchant.id).select("id").maybeSingle();
  if (error || !data) redirect(`/dashboard/products?error=${error ? "failed" : "notFound"}`);
  refreshDashboard();
  redirect("/dashboard/products?notice=offerDeleted");
}

export type ImportState = { status: "idle" | "done" | "error"; created: number; updated: number; problems: ImportProblem[]; fileError?: boolean };

const MAX_IMPORT_BYTES = 1024 * 1024;
const CATALOG_PAGE = 1000;
const MAX_CATALOG_ROWS = 50_000;

export async function importOffers(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const empty: ImportState = { status: "error", created: 0, updated: 0, problems: [] };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMPORT_BYTES) return { ...empty, fileError: true };
  const { rows, problems } = parseImport(await file.text());
  if (!rows.length) return { ...empty, problems };

  const { supabase, merchant } = await requireMerchant();

  // Index the catalog by brand + name + model. PostgREST caps each response, so read it in pages.
  const catalog = new Map<string, string>();
  for (let from = 0; from < MAX_CATALOG_ROWS; from += CATALOG_PAGE) {
    const { data, error } = await supabase.from("canonical_products").select("id,brand,name,model").order("id").range(from, from + CATALOG_PAGE - 1);
    if (error) { console.error("Catalog read failed", error.message); return { ...empty, problems }; }
    for (const product of data ?? []) catalog.set(catalogKey(product.brand, product.name, product.model), product.id);
    if ((data?.length ?? 0) < CATALOG_PAGE) break;
  }

  const { data: existing, error: existingError } = await supabase.from("merchant_offers").select("product_id,condition,merchant_sku").eq("merchant_id", merchant.id);
  if (existingError) { console.error("Offer read failed", existingError.message); return { ...empty, problems }; }
  const offerKey = (productId: string, condition: string, sku: string | null) => `${productId}|${condition}|${sku ?? ""}`;
  const existingKeys = new Set((existing ?? []).map((offer) => offerKey(offer.product_id, offer.condition, offer.merchant_sku)));

  const now = new Date().toISOString();
  const seen = new Set<string>();
  const payload = [];
  let updated = 0;
  for (const row of rows) {
    const productId = catalog.get(catalogKey(row.brand, row.name, row.model));
    if (!productId) { problems.push({ line: row.line, reason: "no_catalog_match" }); continue; }
    const key = offerKey(productId, row.condition, row.sku);
    if (seen.has(key)) { problems.push({ line: row.line, reason: "duplicate_row" }); continue; }
    seen.add(key);
    if (existingKeys.has(key)) updated++;
    payload.push({ merchant_id: merchant.id, product_id: productId, condition: row.condition, merchant_sku: row.sku, price: row.price, currency: row.currency, availability: row.availability, updated_at: now });
  }

  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await supabase.from("merchant_offers").upsert(payload.slice(i, i + 500), { onConflict: "merchant_id,product_id,condition,merchant_sku", defaultToNull: false });
    if (error) {
      console.error("Offer import failed", error.message);
      return { status: "error", created: 0, updated: 0, problems: problems.sort((a, b) => a.line - b.line) };
    }
  }
  refreshDashboard();
  return { status: "done", created: payload.length - updated, updated, problems: problems.sort((a, b) => a.line - b.line) };
}
