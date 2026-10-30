import { SHAPES, SHAPE_IDS, type ObjectShapeId } from "../shapes/registry";

/** What the user wants, as far as plain text parsing can tell. */
export type Intent =
  | { kind: "transform"; shape: ObjectShapeId }
  | { kind: "unsupported"; requested: string }
  | { kind: "revert" }
  | { kind: "chat" };

const REVERT_PATTERNS = [
  /\b(turn|change|go|switch|shift|morph|transform)\s+(yourself\s+)?back\b/,
  /\bback to (normal|yourself|you|your(self| (normal|original|true|real|usual) (form|self|shape)))\b/,
  /\b(be|become) (yourself|you) again\b/,
  /\bbe yourself\b/,
  /\b(original|normal|true|real|usual) (form|self|shape)\b/,
  /^\s*(undo|revert|reset)\b/,
];

const TRANSFORM_PATTERNS = [
  /\b(?:turn|transform|morph|change|shift|shapeshift|shape shift|switch|convert|evolve)\s+(?:yourself\s+|urself\s+)?in(?:to)?\s+(.+)/,
  /\b(?:turn|transform|morph|change|shift|shapeshift|switch)\s+to\s+(?:an?\s+|the\s+)(.+)/,
  /\bbecome\s+(.+)/,
  /\b(?:make|form)\s+(?:yourself\s+|urself\s+)?(?:into\s+)?(?:an?|the)\s+(.+)/,
  /\b(?:can|could|would|will)\s+you\s+be\s+(.+)/,
  /^\s*(?:please\s+)?be\s+(?:an?|the|my)\s+(.+)/,
  /\b(?:show me|give me)\s+(?:an?|the)\s+(.+)/,
  /\byou(?:'re| are) (?:now )?an?\s+(.+)/,
];

const ARTICLES = /^(?:an?|the|some|my|your|one|like an?)\s+/;
const TRAILING = /\b(?:please|pls|now|right now|for me|again|already|instead|real quick|thanks|thank you)\b.*$/;

const ALIASES: { alias: string; id: ObjectShapeId }[] = SHAPE_IDS.flatMap((id) =>
  SHAPES[id].aliases.map((alias) => ({ alias, id })),
).sort((a, b) => b.alias.length - a.alias.length);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Find the first supported shape mentioned in a phrase (longest alias wins). */
export function matchShape(phrase: string): ObjectShapeId | null {
  const text = ` ${normalize(phrase)} `;
  for (const { alias, id } of ALIASES) {
    if (text.includes(` ${alias} `)) return id;
  }
  return null;
}

function cleanRequested(phrase: string) {
  const words = normalize(phrase).replace(ARTICLES, "").replace(TRAILING, "").trim().split(" ").filter(Boolean);
  return words.slice(0, 4).join(" ");
}

export function detectIntent(message: string): Intent {
  const text = normalize(message);
  if (!text) return { kind: "chat" };
  if (REVERT_PATTERNS.some((p) => p.test(text))) return { kind: "revert" };

  for (const pattern of TRANSFORM_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const phrase = match[1].replace(TRAILING, "").trim();
    const shape = matchShape(phrase);
    if (shape) return { kind: "transform", shape };
    const requested = cleanRequested(phrase);
    // "Can you be serious?" is a question, not a transformation into "serious".
    if (!requested || /^(serious|quiet|nice|honest|funny|real|more|less|happy|sad|kind|friends?)\b/.test(requested)) continue;
    return { kind: "unsupported", requested };
  }

  // A bare noun ("banana!", "a cat please") counts as a request.
  if (text.split(" ").length <= 4) {
    const shape = matchShape(text);
    if (shape && normalize(text.replace(TRAILING, "")).replace(ARTICLES, "").split(" ").length <= 2) {
      return { kind: "transform", shape };
    }
  }
  return { kind: "chat" };
}
