/**
 * Site-wide copy and navigation. Items without an `href` are rendered as
 * upcoming (non-interactive) until their page exists.
 */
export type NavItem = { id: string; label: string; href?: string };

export const navigation: NavItem[] = [
  { id: "home", label: "Home", href: "#top" },
  { id: "ventures", label: "Our Ventures", href: "#ecosystem" },
  { id: "technology", label: "Technology" },
  { id: "about", label: "About" },
  { id: "careers", label: "Careers" },
];

export const contactCta: { label: string; href?: string } = { label: "Get in Touch" };

export const manifesto = ["People", "Ideas", "Technology", "A brighter tomorrow"];
export const signOff = ["A more connected", "tomorrow"];

export const hero = {
  eyebrow: ["A global", "technology company"],
  headline: ["Different ventures.", "One vision."],
  body: "We build and scale digital products and ventures that create meaningful impact around the world.",
  primaryCta: { label: "Explore Ecosystem", href: "#ecosystem" },
  scrollHint: ["Scroll", "to explore"],
};

export const ecosystem = {
  eyebrow: "Our ecosystem",
  headline: ["One vision.", "Many ventures."],
  body: "Different industries. A shared conviction. We build and scale digital products and ventures that create meaningful impact around the world.",
  scrollHint: ["Scroll", "to discover"],
};

/** Chapters drive the progress rail; append one per new home-page scene. */
export const chapters = [
  { id: "home", navId: "home" },
  { id: "ecosystem", navId: "ventures" },
];
