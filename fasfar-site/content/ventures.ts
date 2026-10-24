/**
 * Venture registry — the single source of truth for every FASFAR venture.
 *
 * Adding a venture: append an entry here and (optionally) a mark in
 * `components/ventures/venture-mark.tsx`. Scenes, cards, navigation and the
 * 3D anchors all read from this list, so nothing else needs to change.
 */
import type { SculptureAnchorId } from "@/components/three/sculpture/parts";

export type Venture = {
  slug: string;
  name: string;
  sector: string;
  tagline: string;
  /** Brand accent, used for the mark and the card glow. */
  accent: string;
  /** Show this venture on the ecosystem scene. */
  featured: boolean;
  /** Sculpture component the card's leader line points to. */
  anchor?: SculptureAnchorId;
  /** Public site, once one exists. Cards only become links when this is set. */
  url?: string;
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
  },
  {
    slug: "garpuz",
    name: "GARPUZ",
    sector: "Commerce / Price Intelligence",
    tagline: "Real-time market intelligence for smarter decisions.",
    accent: "#f08a4b",
    featured: true,
    anchor: "satellite",
  },
  {
    slug: "menuflex",
    name: "MenuFlex",
    sector: "Digital Hospitality",
    tagline: "All-in-one digital solutions for modern hospitality.",
    accent: "#f39a4a",
    featured: true,
    anchor: "pearl-lower",
  },
  {
    slug: "ffmate",
    name: "FFMate",
    sector: "AI Automation",
    tagline: "Intelligent automation for a more productive world.",
    accent: "#5b8cff",
    featured: true,
    anchor: "base",
  },
];

export const featuredVentures = ventures.filter((v) => v.featured);
