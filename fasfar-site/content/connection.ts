/**
 * Scene 7 — The Connection. Copy and opportunity categories. Panels describe
 * the kind of collaboration in general terms; they make no claims about
 * existing partners, investors or agreements.
 */

import type { ContactCategoryId } from "./finale";

export type OpportunityCategory = {
  id: string;
  title: string;
  /** One line shown on the network. */
  summary: string;
  /** Shown only when true. Future categories ship switched off. */
  enabled: boolean;
  /** The Scene 8 contact category to preselect once a visitor has chosen this path. */
  contactCategory: ContactCategoryId;
  panel: {
    heading: string;
    intro: string;
    /** Who this is for. */
    audience: string[];
    /** What a first conversation could cover. */
    topics: string[];
  };
};

export const connectionIntro = {
  eyebrow: "The connection",
  lines: ["GREAT THINGS", "BEGIN WITH", "A"],
  /** Animated letter by letter. */
  keyword: "CONNECTION.",
};

export const network = {
  eyebrow: "Ways to connect",
  hint: "Choose a path",
  center: "FASFAR",
};

export const opportunityCategories: OpportunityCategory[] = [
  {
    id: "partner",
    title: "PARTNER WITH US",
    summary: "For businesses and organizations interested in collaborating with FASFAR.",
    enabled: true,
    contactCategory: "partnerships",
    panel: {
      heading: "Partner with FASFAR",
      intro: "FASFAR develops digital businesses across different industries. If your organization sees a way to work together, we would like to hear about it.",
      audience: ["Businesses and organizations", "Teams looking for a technology collaborator", "Companies operating in industries where FASFAR is active"],
      topics: ["Who you are and what your organization does", "The collaboration you have in mind", "How it could connect with FASFAR or its ventures"],
    },
  },
  {
    id: "build",
    title: "BUILD WITH US",
    summary: "For founders, entrepreneurs, and innovators exploring new ideas.",
    enabled: true,
    contactCategory: "collaboration",
    panel: {
      heading: "Build with FASFAR",
      intro: "FASFAR turns ideas into products and businesses. If you are exploring an idea and are interested in building it with a technology company, start with a conversation.",
      audience: ["Founders and entrepreneurs", "Innovators with an early idea", "Builders looking for a long-term partner"],
      topics: ["The idea and the problem it solves", "Where it stands today", "What you are looking for in a collaboration"],
    },
  },
  {
    id: "explore",
    title: "EXPLORE OPPORTUNITIES",
    summary: "Discover potential opportunities across the FASFAR ecosystem.",
    enabled: true,
    contactCategory: "business",
    panel: {
      heading: "Explore opportunities",
      intro: "FASFAR develops several ventures and continues to explore new ones. If you see a potential opportunity across the ecosystem, we are open to discussing it.",
      audience: ["Anyone interested in the FASFAR ecosystem", "People and organizations with an opportunity in mind", "Those curious about where FASFAR is heading"],
      topics: ["The opportunity you see", "Which venture or area it relates to", "How you would like to be involved"],
    },
  },
  // Future categories: write their panel copy, then set `enabled: true`.
  ...(
    [
      ["strategic", "STRATEGIC PARTNERSHIPS", "partnerships"],
      ["technology", "TECHNOLOGY COLLABORATIONS", "collaboration"],
      ["business-development", "BUSINESS DEVELOPMENT", "business"],
      ["startups", "STARTUP COLLABORATIONS", "collaboration"],
      ["investment", "INVESTMENT INQUIRIES", "business"],
      ["other", "OTHER OPPORTUNITIES", "general"],
    ] as const
  ).map(([id, title, contactCategory]) => ({
    id,
    title,
    summary: "",
    enabled: false,
    contactCategory,
    panel: { heading: "", intro: "", audience: [], topics: [] },
  })),
];

export const enabledCategories = opportunityCategories.filter((c) => c.enabled);

export const invitation = {
  lines: ["LET’S BUILD", "SOMETHING", "MEANINGFUL."],
  body: "The next great idea could begin with a conversation.",
};

/**
 * Where "Start a conversation" leads: Scene 8's contact experience. Without
 * an href the button shows "Coming soon" and goes nowhere.
 */
export const conversationCta: { label: string; href?: string } = { label: "START A CONVERSATION", href: "#contact" };
