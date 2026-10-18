export type SearchOffer = {
  offer_id: string;
  product_id: string;
  product_name: string;
  brand: string;
  model: string | null;
  specifications: Record<string, string> | null;
  image_url: string | null;
  merchant_name: string;
  city: string;
  price: number;
  currency: string;
  condition: "new" | "used" | "refurbished";
  availability: "in_stock" | "out_of_stock" | "preorder";
  whatsapp: string;
  website: string | null;
  total_count: number;
};

export type SearchFilters = {
  cities: string[];
  brands: string[];
  conditions: string[];
  availabilities: string[];
};
