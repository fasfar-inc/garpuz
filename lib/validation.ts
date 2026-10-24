import { z } from "zod";
import { parsePrice } from "@/lib/product-text";
import { normalizePhone } from "@/lib/utils";

export const CITIES = ["Lefkoşa", "Girne", "Gazimağusa", "İskele", "Güzelyurt", "Lefke"] as const;
export const CONDITIONS = ["new", "used", "refurbished"] as const;
export const AVAILABILITIES = ["in_stock", "out_of_stock", "preorder"] as const;
/** Product categories a shop chooses from: the homepage categories first, then broader ones. */
export const PRODUCT_CATEGORIES = [
  "Mobile Phones", "Computers", "Gaming", "Electronics", "Accessories", "Home Appliances",
  "Home & Garden", "Fashion", "Automotive", "Sports", "Health & Beauty", "Groceries", "Other",
] as const;

/** The listed category matching `value` case-insensitively, or "" when it is not one of them. */
export function productCategory(value: string | null | undefined) {
  const key = (value ?? "").trim().toLocaleLowerCase("en");
  return PRODUCT_CATEGORIES.find((category) => category.toLocaleLowerCase("en") === key) ?? "";
}

const phone = z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/);

/** The three details a shop gives: name, town and the WhatsApp number customers message. */
export const shopSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  city: z.enum(CITIES),
  // Stored as international digits only, matching the database check constraint.
  whatsapp: phone.transform(normalizePhone).pipe(z.string().regex(/^[0-9]{8,15}$/)),
});

/** A product as a shop describes it: one name (with size where relevant), a category and a price in lira. */
export const productSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).optional().transform((value) => value || null),
  name: z.string().transform((value) => value.replace(/\s+/g, " ").trim()).pipe(z.string().min(2).max(160)),
  category: z.enum(PRODUCT_CATEGORIES),
  price: z.string().transform((value) => parsePrice(value) ?? -1).pipe(z.number().gt(0).max(99_999_999)).transform((value) => Math.round(value * 100) / 100),
});

// Filter forms submit "" for "any", which must mean "no filter" rather than an invalid value.
const blankAsUndefined = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  sort: z.enum(["relevance", "price_asc", "price_desc"]).default("relevance"),
  city: blankAsUndefined(z.string().max(60)),
  condition: blankAsUndefined(z.enum(CONDITIONS)),
  brand: blankAsUndefined(z.string().max(80)),
  availability: blankAsUndefined(z.enum(AVAILABILITIES)),
  page: z.coerce.number().int().positive().max(500).default(1),
});

// Browsing by catalog category. Characters PostgREST treats as filter syntax or wildcards are rejected.
export const categoryBrowseSchema = searchSchema.omit({ q: true }).extend({
  category: z.string().trim().min(1).max(80).regex(/^[^*%_\\,()]+$/),
});

