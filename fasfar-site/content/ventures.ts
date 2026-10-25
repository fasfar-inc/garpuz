/**
 * Venture registry — the single source of truth for every FASFAR venture.
 *
 * Adding a venture: append an entry here. Scenes, cards, the showcase,
 * navigation and the 3D anchors all read from this list. Optional extras:
 * a mark in `components/ventures/venture-mark.tsx` (ecosystem cards), an
 * official logo in `components/ventures/venture-logo.tsx`, and a bespoke
 * visual in `components/showcase/visuals` (otherwise a generic one is used).
 */
import type { SculptureAnchorId } from "@/components/three/sculpture/parts";

export type VentureColors = {
  /** Main brand colour: buttons, highlights. */
  primary: string;
  /** Secondary accent. */
  secondary: string;
  /** Showcase background. */
  surface: string;
  /** Text colour on `surface`. */
  ink: string;
};

export type VentureMedia = { src: string; alt: string; width: number; height: number };

/** Official logo only: a coded wordmark (see venture-logo.tsx) or an image file. */
export type VentureLogo = { wordmark: string } | (VentureMedia & { wordmark?: never });

/** Interactive visual the showcase renders; unknown values fall back to a generic visual. */
export type ShowcaseVisual = "mobility" | "commerce" | "hospitality" | "automation";

export type Venture = {
  slug: string;
  name: string;
  /** Short sector label on the ecosystem cards (Scene 2). */
  sector: string;
  tagline: string;
  /** Brand accent, used for the mark and the card glow. */
  accent: string;
  /** Show this venture on the ecosystem scene. */
  featured: boolean;
  /** Sculpture component the card's leader line points to. */
  anchor?: SculptureAnchorId;

  /** Industry line in the showcase (Scene 4). */
  industry: string;
  /** One or two sentences. Facts only — no metrics or launch claims. */
  description: string;
  colors: VentureColors;
  /** Leave unset until an official logo exists; the name is then set in type. */
  logo?: VentureLogo;
  /** Official imagery the showcase may use. */
  media: Record<string, VentureMedia>;
  visual: ShowcaseVisual;
  /** Verified public website. Leave unset until confirmed — nothing links to a guess. */
  url?: string;
  /** Optional dedicated page on this site, e.g. "/ventures/gardas". */
  page?: string;
};

export const ventures: Venture[] = [
  {
    slug: "gardas",
    name: "GARDAŞ",
    sector: "Mobility",
    tagline: "Smarter mobility for a more connected world.",
    accent: "#f4f4f4",
    featured: true,
    anchor: "crown",
    industry: "Mobility & Delivery",
    description: "Smarter mobility for a more connected world.",
    colors: { primary: "#1f4fd8", secondary: "#8fb0ff", surface: "#f1ede6", ink: "#141312" },
    media: {},
    visual: "mobility",
  },
  {
    slug: "garpuz",
    name: "GARPUZ",
    sector: "Commerce / Price Intelligence",
    tagline: "Real-time market intelligence for smarter decisions.",
    accent: "#f08a4b",
    featured: true,
    anchor: "satellite",
    industry: "Commerce & Price Intelligence",
    description: "A local product search engine for North Cyprus. Find it locally. Compare prices.",
    // From the GARPUZ product: wordmark green and the watermelon red.
    colors: { primary: "#07834a", secondary: "#f2414f", surface: "#f4f1e8", ink: "#10241a" },
    logo: { wordmark: "garpuz" },
    media: {
      emblem: { src: "/ventures/garpuz/watermelon.webp", alt: "GARPUZ watermelon emblem", width: 768, height: 512 },
      phones: { src: "/ventures/garpuz/mobile-phones.webp", alt: "Mobile phones", width: 165, height: 240 },
      computers: { src: "/ventures/garpuz/computers.webp", alt: "Computers", width: 250, height: 180 },
      electronics: { src: "/ventures/garpuz/electronics.webp", alt: "Electronics", width: 250, height: 180 },
      gaming: { src: "/ventures/garpuz/gaming.webp", alt: "Gaming", width: 250, height: 180 },
    },
    visual: "commerce",
  },
  {
    slug: "menuflex",
    name: "MenuFlex",
    sector: "Digital Hospitality",
    tagline: "All-in-one digital solutions for modern hospitality.",
    accent: "#f39a4a",
    featured: true,
    anchor: "pearl-lower",
    industry: "Digital Hospitality",
    description: "All-in-one digital solutions for modern hospitality.",
    colors: { primary: "#f39a4a", secondary: "#ffd7a8", surface: "#1b120e", ink: "#f6ece1" },
    media: {},
    visual: "hospitality",
  },
  {
    slug: "ffmate",
    name: "FFMate",
    sector: "AI Automation",
    tagline: "Intelligent automation for a more productive world.",
    accent: "#5b8cff",
    featured: true,
    anchor: "base",
    industry: "Artificial Intelligence & Business Automation",
    description: "Intelligent automation for a more productive world.",
    colors: { primary: "#5b8cff", secondary: "#9ef0ff", surface: "#060a14", ink: "#e8eeff" },
    media: {},
    visual: "automation",
  },
];

export const featuredVentures = ventures.filter((v) => v.featured);
