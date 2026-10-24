"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createCatalogProduct, findCatalogProduct, readProductImage, searchCatalog, uploadProductImage, type CatalogMatch, type NewCatalogProduct } from "@/lib/catalog";
import { catalogKey, parseImport, type ImportProblem } from "@/lib/catalog-import";
import { requireMerchant } from "@/lib/merchant";
import { allowRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { listingSchema, offerUpdateSchema, PRODUCT_CATEGORIES, profileSchema } from "@/lib/validation";

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

/** Catalog products matching what the shop typed into the product picker. */
export async function findProducts(query: string): Promise<CatalogMatch[]> {
  const { supabase } = await requireMerchant();
  try {
    return await searchCatalog(supabase, String(query).slice(0, 100));
  } catch (error) {
    console.error("Catalog search failed", error instanceof Error ? error.message : error);
    return [];
  }
}

/** `added` changes on every successful submission so the form knows to clear itself. */
export type ListingState = { error?: string; field?: string; added?: number };

/**
 * Adds a listing. The product is either picked from the catalog or described by the shop, in which case
 * it is added to the catalog (or matched to an identical product another shop already added).
 */
export async function createListing(_previous: ListingState, formData: FormData): Promise<ListingState> {
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "form") };
  const photo = formData.get("photo");
  const image = photo instanceof File && photo.size > 0 ? await readProductImage(photo) : undefined;
  if (image === null) return { error: "photoInvalid", field: "photo" };

  const { supabase, merchant } = await requireMerchant();
  const listing = parsed.data;
  let product: CatalogMatch | null;
  try {
    if (listing.mode === "existing") {
      const { data, error } = await supabase.from("canonical_products").select("id,name,brand,model,category,image_url").eq("id", listing.productId).maybeSingle();
      if (error) throw new Error(error.message);
      product = data;
      if (!product) return { error: "productMissing" };
    } else {
      product = await findCatalogProduct(supabase, listing);
    }
    // A shop's photo only fills in a catalog product that has none, so it is not stored otherwise.
    const newPhoto = product?.image_url ? undefined : image;
    // Photos and new catalog products are written with the service role; the shop has no catalog privileges.
    const needsAdmin = Boolean(newPhoto) || !product;
    if (needsAdmin && !(await allowRequest("CATALOG_RATE_LIMITER", merchant.id))) return { error: "tooMany" };
    const admin = needsAdmin ? createAdminClient() : null;
    if (needsAdmin && !admin) return { error: "failed" };
    const imageUrl = newPhoto && admin ? await uploadProductImage(admin, merchant.id, newPhoto) : null;
    if (!product) product = await createCatalogProduct(admin!, listing as NewCatalogProduct, imageUrl);
    else if (imageUrl) {
      const { error } = await admin!.from("canonical_products").update({ image_url: imageUrl }).eq("id", product.id).is("image_url", null);
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    console.error("Listing product step failed", error instanceof Error ? error.message : error);
    return { error: "failed" };
  }

  const { error } = await supabase.from("merchant_offers").insert({
    merchant_id: merchant.id, product_id: product.id, price: listing.price, currency: listing.currency,
    condition: listing.condition, availability: listing.availability, merchant_sku: listing.sku,
  });
  if (error) {
    if (error.code !== "23505") console.error("Offer creation failed", error.message);
    return { error: error.code === "23505" ? "offerDuplicate" : "failed" };
  }
  refreshDashboard();
  return { added: Date.now() };
}

export async function updateOffer(formData: FormData) {
  const parsed = offerUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) invalid("/dashboard/products", parsed.error);
  const { supabase, merchant } = await requireMerchant();
  const { data, error } = await supabase.from("merchant_offers")
    .update({ price: parsed.data.price, currency: parsed.data.currency, availability: parsed.data.availability, updated_at: new Date().toISOString() })
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

export type ImportState = { status: "idle" | "done" | "error"; created: number; updated: number; newProducts: number; problems: ImportProblem[]; fileError?: boolean };

const MAX_IMPORT_BYTES = 1024 * 1024;
const CATALOG_PAGE = 1000;
const MAX_CATALOG_ROWS = 50_000;

export async function importOffers(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const empty: ImportState = { status: "error", created: 0, updated: 0, newProducts: 0, problems: [] };
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

  // Products the catalog does not have yet are added to it, as when a shop adds a single new product.
  const missing = new Map<string, NewCatalogProduct>();
  const fallbackCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(merchant.category) ? merchant.category : "Other";
  for (const row of rows) {
    const key = catalogKey(row.brand, row.name, row.model);
    if (!catalog.has(key) && !missing.has(key)) missing.set(key, { brand: row.brand, name: row.name, model: row.model, category: row.category ?? fallbackCategory });
  }
  let newProducts = 0;
  const admin = missing.size && (await allowRequest("CATALOG_RATE_LIMITER", merchant.id)) ? createAdminClient() : null;
  if (admin) {
    const pending = [...missing.values()];
    for (let i = 0; i < pending.length; i += 500) {
      const batch = pending.slice(i, i + 500);
      const { data, error } = await admin.from("canonical_products").insert(batch).select("id,brand,name,model");
      if (!error) {
        for (const product of data ?? []) catalog.set(catalogKey(product.brand, product.name, product.model), product.id);
        newProducts += data?.length ?? 0;
        continue;
      }
      // Another shop added one of these products meanwhile: add them one at a time, reusing what exists.
      for (const product of batch) {
        try {
          const created = await createCatalogProduct(admin, product, null);
          catalog.set(catalogKey(created.brand, created.name, created.model), created.id);
        } catch (failure) {
          console.error("Catalog product import failed", failure instanceof Error ? failure.message : failure);
        }
      }
    }
  }

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
      return { status: "error", created: 0, updated: 0, newProducts, problems: problems.sort((a, b) => a.line - b.line) };
    }
  }
  refreshDashboard();
  return { status: "done", created: payload.length - updated, updated, newProducts, problems: problems.sort((a, b) => a.line - b.line) };
}
