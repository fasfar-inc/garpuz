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
 * Supplied by the site owner; their baked-in name labels were removed because the banner shows
 * the city name itself. `position` keeps each landmark in frame on narrow screens.
 */
export const CITY_PHOTOS: CityPhoto[] = [
  { city: "Girne", src: "/home/cities/girne.webp", alt: "Girne harbour and castle below the Kyrenia mountains", position: "30% 55%" },
  { city: "Lefkoşa", src: "/home/cities/lefkosa.webp", alt: "The Selimiye Mosque above the rooftops of Lefkoşa", position: "50% 45%" },
  { city: "Gazimağusa", src: "/home/cities/gazimagusa.webp", alt: "The Lala Mustafa Pasha Mosque in the old town of Gazimağusa", position: "55% 45%" },
  { city: "İskele", src: "/home/cities/iskele.webp", alt: "Long sandy beach and seafront hotels in İskele", position: "62% 50%" },
  { city: "Güzelyurt", src: "/home/cities/guzelyurt.webp", alt: "Orange groves below the mountains at Güzelyurt", position: "50% 40%" },
];
