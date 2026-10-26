/**
 * Company content for Scene 6 — Inside FASFAR. Everything here is editable
 * copy or verified data. Lists that are empty are simply not rendered, so
 * add entries only when the information is confirmed.
 */
import { ventures, type Venture } from "./ventures";

export const insideIntro = {
  eyebrow: "Inside FASFAR",
  title: ["INSIDE", "FASFAR"],
  lines: ["ONE COMPANY.", "ENDLESS POSSIBILITIES."],
};

export type ProcessVisual = "create" | "build" | "operate" | "grow";
export type ProcessStep = { id: string; title: string; description: string; visual: ProcessVisual };

export const howWeBuild = {
  eyebrow: "How we build",
  steps: [
    { id: "create", title: "CREATE", description: "Turning ideas into products.", visual: "create" },
    { id: "build", title: "BUILD", description: "Developing technology and digital platforms.", visual: "build" },
    { id: "operate", title: "OPERATE", description: "Building businesses for real-world use.", visual: "operate" },
    { id: "grow", title: "GROW", description: "Developing products and exploring new opportunities.", visual: "grow" },
  ] satisfies ProcessStep[],
};

/**
 * The FASFAR structure. Each group is drawn as its own ring around FASFAR,
 * and empty groups are hidden. Labels describe what is developed under
 * FASFAR; they deliberately make no claim about legal entities.
 */
export type StructureItem = {
  id: string;
  name: string;
  /** Short line under the name, e.g. the industry. */
  detail: string;
  summary?: string;
  /** A venture from the registry; opens its details sheet. */
  venture?: Venture;
  /** Page on this site for items that are not ventures. */
  href?: string;
};
export type StructureGroup = { id: string; label: string; items: StructureItem[] };

export const structure = {
  eyebrow: "The FASFAR structure",
  title: ["One parent company.", "Many ventures."],
  body: "FASFAR develops and operates ventures and digital platforms across different industries.",
  center: { name: "FASFAR", detail: "Parent company" },
  groups: [
    {
      id: "ventures",
      label: "Ventures & platforms",
      items: ventures.map((v) => ({ id: v.slug, name: v.name, detail: v.industry, summary: v.description, venture: v })),
    },
    // Add when confirmed, e.g. { id: "divisions", label: "Corporate divisions", items: [...] }.
    { id: "divisions", label: "Corporate divisions", items: [] },
    { id: "units", label: "Operating units", items: [] },
  ] as StructureGroup[],
};

export const companyProfile = {
  eyebrow: "Company profile",
  headline: ["Built to create.", "Designed to evolve."],
  body: "FASFAR is a technology company focused on developing digital products and businesses across different industries. Through creativity, technology and long-term thinking, we turn ideas into practical solutions.",
  /** Becomes a link once an About page exists. */
  cta: { label: "About FASFAR" } as { label: string; href?: string },
};

/**
 * Further company information, rendered under the profile only when a list
 * has entries. Leave lists empty until the facts are verified.
 */
export type CompanyInfo = {
  history: { year: string; title: string; body?: string }[];
  leadership: { name: string; role: string; bio?: string }[];
  divisions: { name: string; description: string; href?: string }[];
  offices: { city: string; country: string; address?: string }[];
  partnerships: { name: string; description?: string; href?: string }[];
  announcements: { date: string; title: string; href?: string }[];
};

export const companyInfo: CompanyInfo = {
  history: [],
  leadership: [],
  divisions: [],
  offices: [],
  partnerships: [],
  announcements: [],
};

export const companyInfoLabels: Record<keyof CompanyInfo, string> = {
  history: "History",
  leadership: "Leadership",
  divisions: "Divisions",
  offices: "Offices",
  partnerships: "Partnerships",
  announcements: "Announcements",
};
