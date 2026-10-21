"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AVAILABILITIES, CONDITIONS, CURRENCIES } from "@/lib/constants";
import { mapHeaders, normalizeAvailability, normalizeCondition, parseCsv, parsePrice } from "@/lib/csv";
import { requireMerchant, type SaveResult } from "@/lib/merchant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { offerSchema, productDetailsSchema, shopProfileSchema } from "@/lib/validation";

const uuid = z.string().uuid();
const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
};

function refresh() {
  revalidatePath("/dashboard", "layout");
}

/* ---------- Listings ---------- */

export async function createListing(formData: FormData) {
  const { supabase } = await requireMerchant();
  const offer = offerSchema.safeParse({
    price: text(formData, "price"),
    currency: text(formData, "currency"),
    condition: text(formData, "condition"),
    availability: text(formData, "availability"),
    sku: text(formData, "sku"),
  });
  const productId = uuid.safeParse(text(formData, "productId"));
  let product: Record<string, unknown> | null = null;
  if (productId.success) {
    product = { product_id: productId.data };
  } else {
    const details = productDetailsSchema.safeParse({
      name: text(formData, "name"),
      brand: text(formData, "brand"),
      model: text(formData, "model"),
      category: text(formData, "category"),
      imageUrl: text(formData, "imageUrl"),
    });
    if (details.success) {
      product = { name: details.data.name, brand: details.data.brand, model: details.data.model, category: details.data.category, image_url: details.data.imageUrl };
    }
  }
  const retry = `/dashboard/products/new${productId.success ? `?product=${productId.data}&` : "?"}error=invalid`;
  if (!offer.success || !product) redirect(retry);

  const { data, error } = await supabase.rpc("merchant_save_offers", {
    p_items: [{
      row: 1,
      ...product,
      price: offer.data.price,
      currency: offer.data.currency,
      condition: offer.data.condition,
      availability: offer.data.availability,
      sku: offer.data.sku,
      is_active: formData.get("active") === "on",
    }],
    p_mode: "insert",
  });
  if (error) {
    console.error("createListing failed", error.message);
    redirect(retry);
  }
  const result = (data as SaveResult[] | null)?.[0];
  if (result?.status === "failed" && result.error === "duplicate" && result.offer_id) redirect(`/dashboard/products/${result.offer_id}?error=duplicate`);
  if (!result || result.status === "failed") {
    console.error("createListing rejected", result?.error);
    redirect(retry);
  }
  refresh();
  redirect("/dashboard/products?notice=saved");
}

export async function updateListing(formData: FormData) {
  const { supabase } = await requireMerchant();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) redirect("/dashboard/products?error=notFound");
  const offer = offerSchema.safeParse({
    price: text(formData, "price"),
    currency: text(formData, "currency"),
    condition: text(formData, "condition"),
    availability: text(formData, "availability"),
    sku: text(formData, "sku"),
  });
  if (!offer.success) redirect(`/dashboard/products/${id.data}?error=invalid`);
  const { data, error } = await supabase
    .from("merchant_offers")
    .update({
      price: offer.data.price,
      currency: offer.data.currency,
      condition: offer.data.condition,
      availability: offer.data.availability,
      merchant_sku: offer.data.sku,
      is_active: formData.get("active") === "on",
    })
    .eq("id", id.data)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/dashboard/products/${id.data}?error=${error.code === "23505" ? "duplicate" : "invalid"}`);
  if (!data) redirect("/dashboard/products?error=notFound");
  refresh();
  redirect("/dashboard/products?notice=saved");
}

export async function setListingActive(formData: FormData) {
  const { supabase } = await requireMerchant();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) redirect("/dashboard/products?error=notFound");
  const { data } = await supabase.from("merchant_offers").update({ is_active: text(formData, "active") === "true" }).eq("id", id.data).select("id").maybeSingle();
  if (!data) redirect("/dashboard/products?error=notFound");
  refresh();
  redirect("/dashboard/products?notice=saved");
}

export async function deleteListing(formData: FormData) {
  const { supabase } = await requireMerchant();
  const id = uuid.safeParse(text(formData, "id"));
  if (!id.success) redirect("/dashboard/products?error=notFound");
  const { data } = await supabase.from("merchant_offers").delete().eq("id", id.data).select("id").maybeSingle();
  if (!data) redirect("/dashboard/products?error=notFound");
  refresh();
  redirect("/dashboard/products?notice=deleted");
}

/* ---------- Catalog import ---------- */

export type ImportState = {
  status: "idle" | "error" | "done";
  message?: "errorFile" | "errorEmpty" | "errorHeaders" | "errorTooMany" | "errorServer";
  created: number;
  updated: number;
  failed: { row: number; reason: string }[];
};

const MAX_IMPORT_BYTES = 1024 * 1024;
const MAX_IMPORT_ROWS = 500;

export async function importCatalog(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const empty: ImportState = { status: "error", created: 0, updated: 0, failed: [] };
  const { supabase } = await requireMerchant();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMPORT_BYTES || !/\.(csv|txt)$/i.test(file.name)) return { ...empty, message: "errorFile" };

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return { ...empty, message: "errorEmpty" };
  const columns = mapHeaders(rows[0]);
  for (const required of ["name", "brand", "category", "price"]) if (!columns.includes(required)) return { ...empty, message: "errorHeaders" };
  const body = rows.slice(1);
  if (body.length > MAX_IMPORT_ROWS) return { ...empty, message: "errorTooMany" };

  const failed: ImportState["failed"] = [];
  const items: Record<string, unknown>[] = [];
  body.forEach((cells, index) => {
    const row = index + 2; // spreadsheet row number (row 1 is the header)
    const record: Record<string, string> = {};
    columns.forEach((column, i) => { if (column) record[column] = (cells[i] ?? "").trim(); });
    const price = parsePrice(record.price ?? "");
    const condition = normalizeCondition(record.condition ?? "");
    const availability = normalizeAvailability(record.availability ?? "");
    const currency = (record.currency || "TRY").toUpperCase();
    const problem =
      !record.name ? "Missing name" :
      !record.brand ? "Missing brand" :
      !record.category ? "Missing category" :
      price === null || price < 0 ? "Price must be a number of 0 or more" :
      !(CONDITIONS as readonly string[]).includes(condition) ? `Unknown condition “${record.condition}”` :
      !(AVAILABILITIES as readonly string[]).includes(availability) ? `Unknown availability “${record.availability}”` :
      !(CURRENCIES as readonly string[]).includes(currency) ? `Currency must be one of ${CURRENCIES.join(", ")}` :
      record.image_url && !/^https?:\/\//i.test(record.image_url) ? "Image URL must start with http:// or https://" :
      record.name.length > 160 || record.brand.length > 100 || (record.model ?? "").length > 120 ? "Text is too long" :
      null;
    if (problem) { failed.push({ row, reason: problem }); return; }
    items.push({ row, name: record.name, brand: record.brand, model: record.model || null, category: record.category, image_url: record.image_url || null, price, currency, condition, availability, sku: record.sku || null });
  });

  let created = 0, updated = 0;
  if (items.length) {
    const { data, error } = await supabase.rpc("merchant_save_offers", { p_items: items, p_mode: "upsert" });
    if (error) {
      console.error("importCatalog failed", error.message);
      return { ...empty, message: "errorServer", failed };
    }
    for (const result of (data ?? []) as SaveResult[]) {
      if (result.status === "created") created++;
      else if (result.status === "updated") updated++;
      else failed.push({ row: result.row, reason: result.error ?? "Could not be saved" });
    }
  }
  failed.sort((a, b) => a.row - b.row);
  refresh();
  return { status: "done", created, updated, failed };
}

/* ---------- Shop profile ---------- */

export async function updateProfile(formData: FormData) {
  const { supabase, merchant } = await requireMerchant();
  const parsed = shopProfileSchema.safeParse(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) redirect(`/dashboard/profile?error=invalid&field=${encodeURIComponent(String(parsed.error.issues[0]?.path[0] ?? ""))}`);
  const p = parsed.data;
  const { error } = await supabase.from("merchants").update({
    business_name: p.businessName,
    representative_name: p.representativeName,
    phone: p.phone,
    whatsapp: p.whatsapp,
    category: p.category,
    city: p.city,
    address: p.address,
    website: p.website,
    registration_number: p.registrationNumber,
  }).eq("id", merchant.id);
  if (error) {
    console.error("updateProfile failed", error.code, error.message);
    redirect(`/dashboard/profile?error=${error.code === "23505" ? "registrationTaken" : "invalid"}`);
  }
  refresh();
  redirect("/dashboard/profile?notice=saved");
}

const DOCUMENT_TYPES: Record<string, { ext: string; magic: number[] }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
};

export async function uploadVerificationDocument(formData: FormData) {
  const { merchant } = await requireMerchant();
  const file = formData.get("document");
  const type = file instanceof File ? DOCUMENT_TYPES[file.type] : undefined;
  if (!(file instanceof File) || !type || file.size === 0 || file.size > 5 * 1024 * 1024) redirect("/dashboard/profile?error=docInvalid");
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Trust the file contents, not the browser-supplied type.
  if (!type.magic.every((byte, i) => bytes[i] === byte)) redirect("/dashboard/profile?error=docInvalid");

  const admin = createAdminClient();
  if (!admin) redirect("/dashboard/profile?error=docFailed");
  const path = `${merchant.id}/${Date.now()}.${type.ext}`;
  const { error: uploadError } = await admin.storage.from("business-verification").upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Verification upload failed", uploadError.message);
    redirect("/dashboard/profile?error=docFailed");
  }
  const { error } = await admin.from("merchants").update({ verification_document_path: path }).eq("id", merchant.id);
  if (error) {
    await admin.storage.from("business-verification").remove([path]);
    redirect("/dashboard/profile?error=docFailed");
  }
  if (merchant.verification_document_path && merchant.verification_document_path !== path) {
    await admin.storage.from("business-verification").remove([merchant.verification_document_path]);
  }
  refresh();
  redirect("/dashboard/profile?notice=docSaved");
}
