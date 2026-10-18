export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

export type MerchantRow = {
  id: string; business_name: string; representative_name: string | null; email: string;
  phone: string | null; whatsapp: string | null; category: string; city: string | null;
  address: string | null; website: string | null; registration_number: string | null;
  verification_document_path: string | null; logo_url: string | null;
  status: MerchantStatus; created_at: string; updated_at: string;
};

export type ProductRow = {
  id: string; name: string; brand: string; model: string | null; category: string;
  specifications: Record<string, unknown>; image_url: string | null; created_at: string;
};

export type OfferRow = {
  id: string; merchant_id: string; product_id: string; price: number; currency: string;
  condition: string; availability: string; is_active: boolean; updated_at: string;
  merchants: { business_name: string } | { business_name: string }[] | null;
  canonical_products: { name: string; brand: string } | { name: string; brand: string }[] | null;
};

export function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}
