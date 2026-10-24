import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { catalogKey, productTitle, textKey } from "@/lib/product-text";

export type CatalogMatch = { id: string; name: string; brand: string; model: string | null; category: string; image_url: string | null };
export type NewCatalogProduct = { brand: string; name: string; model: string | null; category: string };

const CATALOG_COLUMNS = "id,name,brand,model,category,image_url";

/** Mirrors `public.fold_search_text` plus the alphanumeric filter used for `search_text`. */
export function foldSearchText(value: string) {
  const folded = value.toLowerCase().replace(/[çğıöşüâîû]/g, (char) => "cgiosuaiu"["çğıöşüâîû".indexOf(char)]);
  return folded.replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Catalog products containing every word of `query`, in any order. */
export async function searchCatalog(supabase: SupabaseClient, query: string, limit = 8) {
  const words = query.split(/\s+/).map(foldSearchText).filter(Boolean).slice(0, 4);
  if (!words.length) return [];
  let request = supabase.from("canonical_products").select(CATALOG_COLUMNS);
  // PostgREST reads `*` as a wildcard and the fold above already removed every other special character.
  for (const word of words) request = request.ilike("search_text", `*${word}*`);
  const { data, error } = await request.order("name").limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as CatalogMatch[];
}

/**
 * LIKE treats `%`, `_` and `\` specially; escaping them makes `ilike` a case-insensitive equality test.
 * PostgREST also reads `*` as `%`; that only widens the candidates, which the exact key check then narrows.
 */
const literal = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** The catalog product with this brand, name and model, compared the way the catalog's unique index does. */
export async function findCatalogProduct(supabase: SupabaseClient, product: NewCatalogProduct) {
  const { data, error } = await supabase.from("canonical_products").select(CATALOG_COLUMNS)
    .ilike("brand", literal(product.brand)).ilike("name", literal(product.name)).limit(50);
  if (error) throw new Error(error.message);
  const key = catalogKey(product.brand, product.name, product.model);
  return ((data ?? []) as CatalogMatch[]).find((row) => catalogKey(row.brand, row.name, row.model) === key) ?? null;
}

/**
 * The catalog product a shop means by `title`, if there is one: its full title ("Apple iPhone 15 128GB")
 * or its title without the brand ("iPhone 15 128GB"), ignoring case and spacing. Shops type one product
 * name, so this keeps listings for the same product together for customers comparing prices.
 */
export async function matchCatalogProduct(supabase: SupabaseClient, title: string) {
  const key = textKey(title);
  const candidates = await searchCatalog(supabase, title, 50);
  return candidates.find((row) => textKey(productTitle(row)) === key)
    ?? candidates.find((row) => textKey(productTitle({ brand: "", name: row.name, model: row.model })) === key)
    ?? null;
}

/**
 * Adds a product to the shared catalog. Shops cannot write the catalog directly, so this runs with the
 * service role after the caller has verified the shop and validated every field. A product that another
 * shop added at the same moment is returned instead of failing.
 */
export async function createCatalogProduct(admin: SupabaseClient, product: NewCatalogProduct, imageUrl: string | null) {
  const { data, error } = await admin.from("canonical_products")
    .insert({ brand: product.brand, name: product.name, model: product.model, category: product.category, image_url: imageUrl })
    .select(CATALOG_COLUMNS).single();
  if (!error && data) return data as CatalogMatch;
  if (error?.code === "23505") {
    const existing = await findCatalogProduct(admin, product);
    if (existing) return existing;
  }
  throw new Error(error?.message ?? "Catalog product could not be created");
}

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, { ext: string; matches: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", matches: (b) => [0x89, 0x50, 0x4e, 0x47].every((byte, i) => b[i] === byte) },
  "image/webp": { ext: "webp", matches: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
};

export type ProductImage = { bytes: Uint8Array; type: string; ext: string };

/** Accepts a JPG, PNG or WebP photo up to 5 MB whose contents match its declared type. */
export async function readProductImage(file: File): Promise<ProductImage | null> {
  const kind = IMAGE_TYPES[file.type];
  if (!kind || file.size === 0 || file.size > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return kind.matches(bytes) ? { bytes, type: file.type, ext: kind.ext } : null;
}

/** Stores a product photo in the public bucket, creating the bucket on first use, and returns its URL. */
export async function uploadProductImage(admin: SupabaseClient, merchantId: string, image: ProductImage) {
  const path = `${merchantId}/${crypto.randomUUID()}.${image.ext}`;
  const upload = () => admin.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, image.bytes, { contentType: image.type, upsert: false, cacheControl: "31536000" });
  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    const created = await admin.storage.createBucket(PRODUCT_IMAGE_BUCKET, { public: true, fileSizeLimit: MAX_IMAGE_BYTES, allowedMimeTypes: Object.keys(IMAGE_TYPES) });
    if (created.error && !/already exists/i.test(created.error.message)) throw new Error(created.error.message);
    ({ error } = await upload());
  }
  if (error) throw new Error(error.message);
  return admin.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
