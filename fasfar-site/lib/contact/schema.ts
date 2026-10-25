import { contactCategories, type ContactCategoryId } from "@/content/finale";

/**
 * The contact form's rules, shared by the browser (instant feedback) and the
 * API route (the check that counts). Keep the two in sync by changing only
 * this file.
 */
export type ContactInput = {
  name: string;
  email: string;
  company: string;
  category: ContactCategoryId;
  message: string;
};
export type ContactField = keyof ContactInput;
export type FieldErrors = Partial<Record<ContactField, string>>;

export const LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 254 },
  company: { max: 160 },
  message: { min: 20, max: 5000 },
} as const;

const CATEGORY_IDS = new Set<string>(contactCategories.map((c) => c.id));
const EMAIL = /^[^\s@<>()[\]",;:\\]+@[^\s@<>()[\]",;:\\]+\.[^\s@<>()[\]",;:\\]{2,}$/;

/** Drop control characters; single-line fields also lose line breaks. */
const clean = (value: unknown, multiline = false) => {
  if (typeof value !== "string") return "";
  const stripped = multiline
    ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    : value.replace(/[\u0000-\u001F\u007F]+/g, " ");
  return stripped.trim();
};

export function validateContact(raw: unknown): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const data = {
    name: clean(r.name).replace(/\s+/g, " "),
    email: clean(r.email).toLowerCase(),
    company: clean(r.company).replace(/\s+/g, " "),
    category: clean(r.category) as ContactCategoryId,
    message: clean(r.message, true),
  };
  const errors: FieldErrors = {};

  if (!data.name) errors.name = "Please enter your full name.";
  else if (data.name.length < LIMITS.name.min) errors.name = "Your name looks too short.";
  else if (data.name.length > LIMITS.name.max) errors.name = `Please keep your name under ${LIMITS.name.max} characters.`;

  if (!data.email) errors.email = "Please enter your email address.";
  else if (data.email.length > LIMITS.email.max || !EMAIL.test(data.email)) errors.email = "Please enter a valid email address, like name@example.com.";

  if (data.company.length > LIMITS.company.max) errors.company = `Please keep the company name under ${LIMITS.company.max} characters.`;

  if (!CATEGORY_IDS.has(data.category)) errors.category = "Please choose what your message is about.";

  if (!data.message) errors.message = "Please tell us what you have in mind.";
  else if (data.message.length < LIMITS.message.min) errors.message = `Please write at least ${LIMITS.message.min} characters.`;
  else if (data.message.length > LIMITS.message.max) errors.message = `Please keep your message under ${LIMITS.message.max} characters.`;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Spam protection fields sent with every submission. */
export const HONEYPOT_FIELD = "website";
/** Humans take longer than this to fill in the form. */
export const MIN_FILL_MS = 3000;

/** The API's answers. `ok` is only ever true once the message was accepted for delivery. */
export type ContactResponse =
  | { ok: true }
  | { ok: false; error: "invalid"; errors: FieldErrors }
  | { ok: false; error: "unavailable" | "rejected" | "rate_limited" | "delivery_failed" };
