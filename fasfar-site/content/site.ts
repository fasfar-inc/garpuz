/**
 * Site-wide copy and navigation. Items without an `href` are rendered as
 * upcoming (non-interactive) until their page exists.
 */
export type NavItem = { id: string; label: string; href?: string };

export const navigation: NavItem[] = [
  { id: "home", label: "Home", href: "#top" },
  { id: "ventures", label: "Our Ventures", href: "#ecosystem" },
  { id: "technology", label: "Technology" },
  { id: "about", label: "About", href: "#beyond" },
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

export const beyond = {
  eyebrow: "Beyond the ordinary",
  statements: ["WE THINK.", "WE CREATE.", "WE BUILD."],
  headline: ["More than one idea.", "More than one industry."],
  body: "FASFAR is a technology company creating and developing digital businesses across different industries.",
  /** Becomes a link once the destination page exists. */
  cta: { label: "Discover FASFAR" } as { label: string; href?: string },
  scrollHint: ["Scroll", "to our ventures"],
};

export const showcase = {
  eyebrow: "Our ventures",
  headline: ["BIG IDEAS.", "DIFFERENT WORLDS."],
  body: "One company. Multiple visions for the future.",
  /** Shown under visuals that depict an interface which is not the shipped product. */
  conceptNote: "Concept visual",
  illustrativeNote: "Illustrative data",
  detailsUnavailable: "A dedicated page and website link will appear here once they are published.",
};

export const horizon = {
  eyebrow: "The horizon",
  tagline: "THE FUTURE ISN'T WAITING.",
  headline: "WE BUILD IT.",
  statements: ["NO LIMITS.", "NO BOUNDARIES.", "JUST POSSIBILITIES."],
  visionEyebrow: "Our vision",
  visionHeadline: "Building what comes next.",
  visionBody:
    "FASFAR develops digital businesses and technology-driven ideas across industries. Our ambition is to create useful products, explore new opportunities, and build for the long term.",
  /** Becomes a link once a vision page exists. */
  cta: { label: "Discover Our Vision" } as { label: string; href?: string },
};

/**
 * Chapters drive the progress rail and header highlighting; append one per new
 * home-page scene. The first three live on the pinned stage timeline; later
 * ones are standalone sections found by their `id`.
 */
export const chapters = [
  { id: "home", navId: "home" },
  { id: "ecosystem", navId: "ventures" },
  { id: "beyond", navId: "about" },
  { id: "showcase", navId: "ventures" },
  { id: "horizon", navId: "about" },
];
