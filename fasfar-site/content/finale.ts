/**
 * Scene 8 — The Grand Finale: the closing reveal, the contact experience
 * and the footer. Only verified or explicitly configured company details
 * belong here; empty fields are simply not rendered.
 */
import { navigation } from "./site";

export const finale = {
  eyebrow: "The beginning of what's next",
  headline: ["WHAT’S NEXT", "STARTS HERE."],
  body: "Every great possibility begins somewhere.",
  cta: { label: "LET’S CONNECT" },
};

export type ContactCategory = { id: ContactCategoryId; label: string; description: string };
export type ContactCategoryId = "business" | "partnerships" | "collaboration" | "general";

/** The four inquiry types. Ids are what the API accepts. */
export const contactCategories: ContactCategory[] = [
  { id: "business", label: "Business Inquiries", description: "Questions about FASFAR, its ventures or working with the company." },
  { id: "partnerships", label: "Partnerships", description: "Organizations interested in partnering with FASFAR." },
  { id: "collaboration", label: "Collaboration", description: "Founders, builders and teams with an idea to develop together." },
  { id: "general", label: "General Inquiries", description: "Anything else you would like to ask or share." },
];

export const contact = {
  heading: ["LET’S START", "A CONVERSATION."],
  body: "Tell us what you have in mind.",
  categoryLegend: "What is it about?",
  /**
   * Link a published privacy policy here once it exists; until then the
   * form only states how this website itself handles the message.
   */
  privacyPolicy: undefined as { label: string; href: string } | undefined,
  privacyNote: "Your details are sent to the FASFAR team only so they can reply to you. This website does not store them.",
  unavailable: "The contact service is not connected yet, so messages can’t be sent from this page. Nothing you type here is sent or stored.",
};

export type FooterLink = { label: string; href: string };

/** Footer navigation. Careers appears automatically once its nav item has a destination. */
const careers = navigation.find((n) => n.id === "careers" && n.href);

export const footer = {
  tagline: "Different ventures. One vision.",
  links: [
    { label: "Home", href: "#top" },
    { label: "Our Ventures", href: "#showcase" },
    { label: "About FASFAR", href: "#inside" },
    { label: "Opportunities", href: "#connect-network" },
    { label: "Contact", href: "#contact" },
    ...(careers?.href ? [{ label: careers.label, href: careers.href }] : []),
  ] satisfies FooterLink[],
  /** Further link groups (legal, press…). Each renders as a column once it has links. */
  groups: [] as { label: string; links: FooterLink[] }[],
  /** Verified company details only, e.g. the registered legal name. */
  company: {
    legalName: undefined as string | undefined,
    registration: undefined as string | undefined,
    address: undefined as string | undefined,
  },
  /** Official social profiles, once confirmed. */
  social: [] as FooterLink[],
  backToTop: "Back to the beginning",
};
