/**
 * Photos used on the homepage, with the attribution their licenses require. The harbour
 * credit is shown on the image; every credit is listed on the About page.
 */
export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string };

export const NORTH_CYPRUS_PHOTO = {
  src: "/home/north-cyprus.webp",
  alt: "Girne (Kyrenia) harbour with the Kyrenia mountains behind",
  position: "50% 55%",
  credit: { author: "PENDING", license: "PENDING", licenseUrl: "PENDING", source: "PENDING" } as PhotoCredit,
};

/** Credits for the category photos, keyed by the image path in FEATURED_CATEGORIES. */
export const CATEGORY_PHOTO_CREDITS: Record<string, PhotoCredit> = {};
