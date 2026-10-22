/**
 * Homepage categories. `name` is the canonical category stored on catalog products
 * (`canonical_products.category`) and used in `/search?category=` links; matching is
 * case-insensitive. Labels are translated through `t.productCategories`.
 */
export const FEATURED_CATEGORIES = [
  { name: "Mobile Phones", image: "/home/categories/mobile-phones.webp" },
  { name: "Computers", image: "/home/categories/computers.webp" },
  { name: "Gaming", image: "/home/categories/gaming.webp" },
  { name: "Electronics", image: "/home/categories/electronics.webp" },
  { name: "Accessories", image: "/home/categories/accessories.webp" },
  { name: "Home Appliances", image: "/home/categories/home-appliances.webp" },
] as const;

export type FeaturedCategory = (typeof FEATURED_CATEGORIES)[number];

export function categoryHref(name: string) {
  return { pathname: "/search", query: { category: name } };
}

export function findFeaturedCategory(name: string) {
  const key = name.trim().toLocaleLowerCase("en");
  return FEATURED_CATEGORIES.find((category) => category.name.toLocaleLowerCase("en") === key);
}
