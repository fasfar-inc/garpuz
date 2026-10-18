"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminMutation } from "@/lib/admin/auth";

const idSchema = z.string().uuid();
const merchantActionSchema = z.object({ id: idSchema, status: z.enum(["approved", "rejected", "suspended"]) });
const productSchema = z.object({
  id: z.union([z.literal(""), idSchema]).optional(),
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().max(120).optional(),
  category: z.string().trim().min(2).max(100),
  imageUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  specifications: z.string().trim().max(10000).default("{}"),
});

async function logAction(admin: Awaited<ReturnType<typeof requireAdminMutation>>["admin"], actorId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  const { error } = await admin.from("admin_audit_logs").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, metadata });
  if (error) throw new Error(`Action succeeded but audit logging failed: ${error.message}`);
}

export async function updateMerchantStatus(formData: FormData) {
  const parsed = merchantActionSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) redirect("/admin/merchants?error=Invalid+merchant+request");
  const { user, admin } = await requireAdminMutation();
  const { data: before, error: readError } = await admin.from("merchants").select("status,business_name").eq("id", parsed.data.id).maybeSingle();
  if (readError || !before) redirect("/admin/merchants?error=Merchant+not+found");
  const { error } = await admin.from("merchants").update({ status: parsed.data.status, updated_at: new Date().toISOString() }).eq("id", parsed.data.id);
  if (error) redirect(`/admin/merchants?error=${encodeURIComponent(error.message)}`);
  await logAction(admin, user.id, "merchant.status_changed", "merchant", parsed.data.id, { from: before.status, to: parsed.data.status, shop: before.business_name });
  revalidatePath("/admin"); revalidatePath("/admin/merchants"); revalidatePath(`/admin/merchants/${parsed.data.id}`);
  redirect(`/admin/merchants/${parsed.data.id}?notice=${encodeURIComponent(`Merchant marked ${parsed.data.status}`)}`);
}

export async function saveProduct(formData: FormData) {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/products?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid product")}`);
  let specifications: Record<string, unknown>;
  try { specifications = JSON.parse(parsed.data.specifications || "{}"); } catch { redirect("/admin/products?error=Specifications+must+be+valid+JSON"); }
  if (!specifications || Array.isArray(specifications) || typeof specifications !== "object") redirect("/admin/products?error=Specifications+must+be+a+JSON+object");
  const { user, admin } = await requireAdminMutation();
  const payload = { name: parsed.data.name, brand: parsed.data.brand, model: parsed.data.model || null, category: parsed.data.category, image_url: parsed.data.imageUrl || null, specifications };
  if (parsed.data.id) {
    const { error } = await admin.from("canonical_products").update(payload).eq("id", parsed.data.id);
    if (error) redirect(`/admin/products/${parsed.data.id}?error=${encodeURIComponent(error.code === "23505" ? "A matching canonical product already exists" : error.message)}`);
    await logAction(admin, user.id, "product.updated", "canonical_product", parsed.data.id, { name: parsed.data.name, brand: parsed.data.brand });
  } else {
    const { data, error } = await admin.from("canonical_products").insert(payload).select("id").single();
    if (error || !data) redirect(`/admin/products?error=${encodeURIComponent(error?.code === "23505" ? "A matching canonical product already exists" : error?.message ?? "Product could not be created")}`);
    await logAction(admin, user.id, "product.created", "canonical_product", data.id, { name: parsed.data.name, brand: parsed.data.brand });
  }
  revalidatePath("/admin"); revalidatePath("/admin/products");
  redirect("/admin/products?notice=Product+saved");
}

export async function toggleOffer(formData: FormData) {
  const parsed = z.object({ id: idSchema, active: z.enum(["true", "false"]) }).safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) redirect("/admin/offers?error=Invalid+offer+request");
  const { user, admin } = await requireAdminMutation();
  const active = parsed.data.active === "true";
  const { data, error } = await admin.from("merchant_offers").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error || !data) redirect("/admin/offers?error=Offer+not+found");
  await logAction(admin, user.id, active ? "offer.enabled" : "offer.disabled", "merchant_offer", parsed.data.id, { is_active: active });
  revalidatePath("/admin"); revalidatePath("/admin/offers");
  redirect(`/admin/offers?notice=${active ? "Offer+enabled" : "Offer+disabled"}`);
}
