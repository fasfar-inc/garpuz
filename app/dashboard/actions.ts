"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createCatalogProduct, matchCatalogProduct, readProductImage, uploadProductImage, type CatalogMatch } from "@/lib/catalog";
import { getSignedInShop, requireMerchant } from "@/lib/merchant";
import { productTitle, textKey } from "@/lib/product-text";
import { allowRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema, shopSchema } from "@/lib/validation";

/** Field name → message key; `form` is for problems that belong to no single field. */
export type FormState = { errors?: Record<string, string> };

const idSchema = z.string().uuid();

function fieldErrors(error: z.ZodError): FormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0] ?? "form")] ??= "invalid";
  return { errors };
}

function refreshShop() {
  revalidatePath("/dashboard", "layout");
}

/** Creates the signed-in user's shop from its name, town and WhatsApp number, then opens My shop. */
export async function createShop(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSignedInShop();
  if (!session?.user.email) return { errors: { form: "signIn" } };
  if (session.merchant) redirect("/dashboard");
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { supabase, user } = session;
  const shop = parsed.data;

  // Shops may only insert these columns; the category is a catalog default, not something to ask for.
  const { error } = await supabase.from("merchants").insert({ user_id: user.id, business_name: shop.businessName, category: "Other", email: user.email!.toLowerCase() });
  if (error) {
    if (error.code === "23505") {
      const existing = await getSignedInShop();
      if (existing?.merchant) redirect("/dashboard");
      return { errors: { form: "emailTaken" } };
    }
    console.error("Shop creation failed", error.message);
    return { errors: { form: "failed" } };
  }
  const { error: detailsError } = await supabase.from("merchants").update({ city: shop.city, whatsapp: shop.whatsapp, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  // The shop exists either way; My shop asks for the missing WhatsApp number if this step failed.
  if (detailsError) console.error("Shop details update failed", detailsError.message);
  refreshShop();
  redirect("/dashboard");
}

export async function updateShop(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { supabase, merchant } = await requireMerchant();
  const { error } = await supabase.from("merchants")
    .update({ business_name: parsed.data.businessName, city: parsed.data.city, whatsapp: parsed.data.whatsapp, updated_at: new Date().toISOString() })
    .eq("id", merchant.id);
  if (error) {
    console.error("Shop update failed", error.message);
    return { errors: { form: "failed" } };
  }
  refreshShop();
  redirect("/dashboard?notice=shopSaved");
}

type OwnOffer = { id: string; product_id: string; canonical_products: CatalogMatch | CatalogMatch[] | null };

/**
 * Adds or edits one of the shop's products from just a name, a price in lira and an optional photo.
 * The name is matched to the shared catalog behind the scenes so customers can compare shops' prices
 * for the same product; a name the catalog does not know yet becomes a new catalog product.
 */
export async function saveProduct(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const photo = formData.get("photo");
  const image = photo instanceof File && photo.size > 0 ? await readProductImage(photo) : undefined;
  if (image === null) return { errors: { photo: "photoInvalid" } };

  const { supabase, merchant } = await requireMerchant();
  const { id, name, price } = parsed.data;
  let offer: OwnOffer | null = null;
  if (id) {
    const { data, error } = await supabase.from("merchant_offers").select("id,product_id,canonical_products(id,name,brand,model,category,image_url)").eq("id", id).eq("merchant_id", merchant.id).maybeSingle();
    if (error) { console.error("Product read failed", error.message); return { errors: { form: "failed" } }; }
    if (!data) return { errors: { form: "notFound" } };
    offer = data as OwnOffer;
  }

  let product: CatalogMatch | null = offer ? [offer.canonical_products].flat()[0] ?? null : null;
  try {
    // Keep the current catalog product unless the shop renamed it.
    if (!product || textKey(productTitle(product)) !== textKey(name)) product = await matchCatalogProduct(supabase, name);
    // A shop's photo only fills in a catalog product that has none, so it is not stored otherwise.
    const newPhoto = product?.image_url ? undefined : image;
    // Photos and new catalog products are written with the service role; shops cannot write the catalog.
    const needsAdmin = Boolean(newPhoto) || !product;
    if (needsAdmin && !(await allowRequest("CATALOG_RATE_LIMITER", merchant.id))) return { errors: { form: "tooMany" } };
    const admin = needsAdmin ? createAdminClient() : null;
    if (needsAdmin && !admin) return { errors: { form: "failed" } };
    const imageUrl = newPhoto && admin ? await uploadProductImage(admin, merchant.id, newPhoto) : null;
    if (!product) product = await createCatalogProduct(admin!, { brand: "", name, model: null, category: merchant.category || "Other" }, imageUrl);
    else if (imageUrl) {
      const { error } = await admin!.from("canonical_products").update({ image_url: imageUrl }).eq("id", product.id).is("image_url", null);
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    console.error("Product catalog step failed", error instanceof Error ? error.message : error);
    return { errors: { form: "failed" } };
  }

  const now = new Date().toISOString();
  const result = offer
    ? await supabase.from("merchant_offers").update({ product_id: product.id, price, currency: "TRY", updated_at: now }).eq("id", offer.id).eq("merchant_id", merchant.id).select("id").single()
    : await supabase.from("merchant_offers").insert({ merchant_id: merchant.id, product_id: product.id, price, currency: "TRY" }).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { errors: { name: "duplicate" } };
    console.error("Product save failed", result.error.message);
    return { errors: { form: "failed" } };
  }
  refreshShop();
  redirect(`/dashboard?saved=${result.data.id}`);
}

const availabilitySchema = z.object({ id: idSchema, availability: z.enum(["in_stock", "out_of_stock"]) });

export async function setAvailability(formData: FormData) {
  const parsed = availabilitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase, merchant } = await requireMerchant();
  const { error } = await supabase.from("merchant_offers").update({ availability: parsed.data.availability, updated_at: new Date().toISOString() }).eq("id", parsed.data.id).eq("merchant_id", merchant.id);
  if (error) console.error("Availability update failed", error.message);
  refreshShop();
}

/** Makes a hidden product visible in search again, e.g. one hidden from the earlier dashboard. */
export async function showProduct(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  const { supabase, merchant } = await requireMerchant();
  const { error } = await supabase.from("merchant_offers").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", parsed.data).eq("merchant_id", merchant.id);
  if (error) console.error("Product show failed", error.message);
  refreshShop();
}

export async function deleteProduct(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  const { supabase, merchant } = await requireMerchant();
  const { error } = await supabase.from("merchant_offers").delete().eq("id", parsed.data).eq("merchant_id", merchant.id);
  if (error) console.error("Product delete failed", error.message);
  refreshShop();
  redirect("/dashboard?notice=productDeleted");
}
