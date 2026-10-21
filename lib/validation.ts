import { z } from "zod";
import { AVAILABILITIES, CITIES, CONDITIONS, CURRENCIES, SHOP_CATEGORIES } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

/** Accepts common local formats and stores digits only (matches the DB check). */
export const whatsappNumber = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s()-]{8,22}$/, "Enter a valid phone number")
  .transform(normalizePhone)
  .refine((digits) => /^[0-9]{8,15}$/.test(digits), "Enter a valid phone number");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => (value ? value : null));

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url().max(300)])
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => !value || /^https?:\/\//i.test(value), "Use an http or https address");

export const shopSetupSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  category: z.enum(SHOP_CATEGORIES),
  whatsapp: whatsappNumber,
  city: z.enum(CITIES),
});

export const shopProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  representativeName: optionalText(120),
  phone: z
    .string()
    .trim()
    .max(22)
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => !value || /^\+?[0-9\s()-]{8,22}$/.test(value), "Enter a valid phone number"),
  whatsapp: whatsappNumber,
  category: z.enum(SHOP_CATEGORIES),
  city: z.enum(CITIES),
  address: optionalText(300),
  website: optionalUrl,
  registrationNumber: optionalText(80),
});

export const productDetailsSchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(100),
  model: optionalText(120),
  category: z.string().trim().min(2).max(100),
  imageUrl: optionalUrl,
});

export const offerSchema = z.object({
  price: z.coerce.number().finite().min(0).max(9_999_999_999),
  currency: z.enum(CURRENCIES).default("TRY"),
  condition: z.enum(CONDITIONS).default("new"),
  availability: z.enum(AVAILABILITIES).default("in_stock"),
  sku: optionalText(80),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  sort: z.enum(["relevance", "price_asc", "price_desc"]).default("relevance"),
  city: z.string().max(60).optional(),
  condition: z.enum(CONDITIONS).optional(),
  brand: z.string().max(80).optional(),
  availability: z.enum(AVAILABILITIES).optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
});
