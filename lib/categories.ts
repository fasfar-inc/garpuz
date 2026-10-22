/**
 * Homepage categories. `name` is the canonical category stored on catalog products
 * (`canonical_products.category`) and used in `/search?category=` links; matching is
 * case-insensitive. Labels are translated through `t.productCategories`.
 */
// Photos are not added yet; a card without `image` shows its category icon instead.
export const FEATURED_CATEGORIES: readonly { name: string; image?: string }[] = [
  { name: "Mobile Phones" },
  { name: "Computers" },
  { name: "Gaming" },
  { name: "Electronics" },
  { name: "Accessories" },
  { name: "Home Appliances" },
];

export type FeaturedCategory = (typeof FEATURED_CATEGORIES)[number];

export function categoryHref(name: string) {
  return { pathname: "/search", query: { category: name } };
}

export function findFeaturedCategory(name: string) {
  const key = name.trim().toLocaleLowerCase("en");
  return FEATURED_CATEGORIES.find((category) => category.name.toLocaleLowerCase("en") === key);
}
