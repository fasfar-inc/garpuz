/**
 * Photos used on the homepage. A photo that needs attribution under its license carries a
 * `credit`, which is shown on the image.
 */
export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string };

export type CityPhoto = {
  city: string;
  src: string;
  alt: string;
  /** CSS object-position for the crop. */
  position: string;
  /** Optional zoom on phones, anchored at `origin`, for wide panoramas whose subject is small. */
  mobileZoom?: { scale: number; origin: string };
  credit?: PhotoCredit;
};

/**
 * City photos for the North Cyprus banner, shown in this order and changing every few seconds.
 * With one photo the banner is static; with none it shows a sky-to-sea gradient.
 * Girne comes from the approved homepage mockup supplied by the site owner (its baked-in label
 * and tagline removed).
 */
export const CITY_PHOTOS: CityPhoto[] = [
  {
    city: "Girne",
    src: "/home/north-cyprus.webp",
    alt: "Girne harbour and castle with the Kyrenia mountains behind",
    position: "38% 70%",
    mobileZoom: { scale: 1.3, origin: "38% 100%" },
  },
];
