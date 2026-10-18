import { z } from "zod";

const phone = z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/, "Enter a valid phone number");

export const registrationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  representativeName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone,
  whatsapp: phone,
  category: z.string().trim().min(2).max(80),
  city: z.enum(["Lefkoşa", "Girne", "Gazimağusa", "İskele", "Güzelyurt", "Lefke"]),
  address: z.string().trim().min(8).max(300),
  website: z.union([z.literal(""), z.string().trim().url()]).optional(),
  registrationNumber: z.string().trim().min(3).max(80),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  sort: z.enum(["relevance", "price_asc", "price_desc"]).default("relevance"),
  city: z.string().max(60).optional(),
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  brand: z.string().max(80).optional(),
  availability: z.enum(["in_stock", "out_of_stock", "preorder"]).optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
