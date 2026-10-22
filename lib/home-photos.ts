/**
 * Photos used on the homepage, with the attribution their licenses require. The harbour
 * credit is shown on the image; every credit is listed on the About page.
 */
export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string };

export type Photo = { src: string; alt: string; position: string; credit: PhotoCredit };

/** The North Cyprus banner photo. Until one is added the banner shows a sky-to-sea gradient. */
export const NORTH_CYPRUS_PHOTO: Photo | null = null;
