import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

export const CITIES = ["Lefkoşa", "Girne", "Gazimağusa", "İskele", "Güzelyurt", "Lefke"] as const;
export const SHOP_CATEGORIES = ["Electronics", "Home & Garden", "Fashion", "Automotive", "Sports", "Health & Beauty", "Groceries", "Other"] as const;
export const CURRENCIES = ["TRY", "EUR", "GBP", "USD"] as const;
export const CONDITIONS = ["new", "used", "refurbished"] as const;
export const AVAILABILITIES = ["in_stock", "out_of_stock", "preorder"] as const;
/** Categories a shop can file a new catalog product under: the homepage categories first, then the broader shop categories. */
export const PRODUCT_CATEGORIES = [
  "Mobile Phones", "Computers", "Gaming", "Electronics", "Accessories", "Home Appliances",
  "Home & Garden", "Fashion", "Automotive", "Sports", "Health & Beauty", "Groceries", "Other",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const phone = z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/, "Enter a valid phone number");
const httpUrl = z.string().trim().max(300).refine((value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Enter a valid web address");

export const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  representativeName: optionalText(120),
  phone: z.union([z.literal(""), phone]).transform((value) => value || null),
  // Stored as international digits only, matching the database check constraint.
  whatsapp: phone.transform(normalizePhone).pipe(z.string().regex(/^[0-9]{8,15}$/)),
  city: z.enum(CITIES),
  address: optionalText(300),
  website: z.union([z.literal(""), httpUrl]).transform((value) => value || null),
  registrationNumber: z.string().trim().max(80).transform((value) => value || null).optional(),
});

const price = z.coerce.number().finite().min(0).max(99_999_999).transform((value) => Math.round(value * 100) / 100);

/** Collapses runs of whitespace so "iPhone  15" and "iPhone 15" are stored as the same catalog product. */
const productText = (min: number, max: number) => z.string().transform((value) => value.replace(/\s+/g, " ").trim()).pipe(z.string().min(min).max(max));

const listingFields = {
  price,
  currency: z.enum(CURRENCIES),
  condition: z.enum(CONDITIONS),
  availability: z.enum(AVAILABILITIES),
  sku: optionalText(80),
};

/** A listing for a product picked from the catalog, or for a new product the shop describes itself. */
export const listingSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("existing"), productId: z.string().uuid(), ...listingFields }),
  z.object({
    mode: z.literal("new"),
    brand: productText(1, 100),
    name: productText(2, 160),
    model: productText(0, 120).transform((value) => value || null),
    category: z.enum(PRODUCT_CATEGORIES),
    ...listingFields,
  }),
]);

export const offerUpdateSchema = z.object({
  id: z.string().uuid(),
  price,
  currency: z.enum(CURRENCIES),
  availability: z.enum(AVAILABILITIES),
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

export type ProfileInput = z.infer<typeof profileSchema>;
