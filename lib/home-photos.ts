/**
 * Photos used on the homepage. A photo that needs attribution under its license carries a
 * `credit`, which is shown on the image.
 */
export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string };

export type Photo = { src: string; alt: string; position: string; credit?: PhotoCredit };

/**
 * The North Cyprus banner, taken from the approved homepage mockup supplied by the site owner
 * (its baked-in label and tagline removed). Set to null to fall back to a sky-to-sea gradient.
 */
export const NORTH_CYPRUS_PHOTO: Photo | null = {
  src: "/home/north-cyprus.webp",
  alt: "Girne harbour and castle with the Kyrenia mountains behind",
  position: "38% 70%",
};
