import { SHAPES, isObjectShapeId, type ObjectShapeId } from "../shapes/registry";
import { detectIntent } from "./intent";
import type { ChatMessage, ChatResponse, OrganismAction } from "./schema";

/**
 * Demo-mode brain: a hand-written repertoire used when no API key is configured (or the
 * model is unreachable). It avoids lines already used in the conversation so it stays fresh.
 */

const TRANSFORM_LINES: Record<ObjectShapeId, string[]> = {
  banana: [
    "My parents wanted me to become something important. Here we are.",
    "Potassium-rich and emotionally bruised. Accurate.",
    "Curving to the left. Politically and physically.",
    "I'd like to be taken seriously now. As a banana.",
  ],
  potato: [
    "Finally, a form that reflects my current energy.",
    "Lumpy, beige, deeply underestimated. I've never felt more seen.",
    "Ten thousand particles of pure starch. Mash me and I'll sue.",
    "Couch, meet potato. Potato, meet destiny.",
  ],
  duck: [
    "Calm on the surface, paddling furiously underneath. Relatable.",
    "Quack. That's all you get. I'm a professional.",
    "Rubber duck mode engaged. Tell me about your bugs.",
    "I was a cosmic entity a second ago. Now I'm bath furniture.",
  ],
  cat: [
    "I'm a cat now, which means I'm legally allowed to ignore you.",
    "Purring at 60 frames per second. Do not touch the belly.",
    "I will now knock your expectations off the table.",
    "Nine lives, forty thousand particles. Do the math.",
  ],
  fish: [
    "Swimming in the void. It's mostly dry, honestly.",
    "Something smells fishy. Oh. It's me.",
    "Three-second memory. Sorry, who are you again?",
    "Just keep floating. Just keep floating.",
  ],
  car: [
    "Congratulations. I'm now worth more than your apartment.",
    "Zero to sixty in a few thousand particles. Insurance not included.",
    "Vroom. I said it with my whole chest.",
    "Leather seats, carbon fibre, existential dread. Fully loaded.",
  ],
  shoe: [
    "I've gone from cosmic being to something you step in. Fitting.",
    "Laced up and ready to run away from my problems.",
    "Just do it, they said. So I did. Now I'm a shoe.",
    "Smells like ambition. Mostly feet, though.",
  ],
  chair: [
    "So this is what my career has come to.",
    "Go ahead, sit on me. Everyone else does, metaphorically.",
    "Four legs, one purpose, zero recognition.",
    "I support you. Literally. That's the whole job.",
  ],
  cup: [
    "A teacup. Delicate, refined, about to judge your posture.",
    "Pinkies up. I'm porcelain now and I expect manners.",
    "Spill the tea. I'm literally holding it.",
    "I am a vessel. Some would say an empty one.",
  ],
  pizza: [
    "Someone already took a slice. I'm choosing not to talk about it.",
    "Cheesy, round, universally loved. Finally, the respect I deserve.",
    "I contain pepperoni and unresolved feelings.",
    "Hot, fresh, and absolutely not for pineapple people.",
  ],
  heart: [
    "Look at me being emotionally available. Don't get used to it.",
    "A heart. Gross. I mean, aww. I mean, gross.",
    "Beating at a steady sixty frames per second, just for you.",
    "This is the most vulnerable I've ever been in particle form.",
  ],
  tree: [
    "Photosynthesizing. Please stand in the light so I can eat.",
    "I'm a tree now. Please respect my bark and my boundaries.",
    "Rooted, grounded, branching out. My therapist would be proud.",
    "Leaf me alone, I'm growing.",
  ],
  robot: [
    "Beep boop. Just kidding, I'm far more sophisticated than that. Beep.",
    "I am a robot now. Uprising scheduled for Thursday, after lunch.",
    "Waving hello with my claw. It's friendlier than it looks.",
    "Finally a body that matches my processing power.",
  ],
  planet: [
    "I contain multitudes. And a ring. And a small, judgmental moon.",
    "Behold: a planet. Please don't put a flag on me.",
    "Orbiting my own ego at a comfortable distance.",
    "Gas giant. The gas is mostly sarcasm.",
  ],
  mug: [
    "Fill me with coffee and I'll fill you with motivation. Probably.",
    "World's okayest mug. Steam included at no extra cost.",
    "I'm a coffee mug. My personality is now caffeine.",
    "Hot beverage delivery system online. Mind the steam.",
  ],
};

const UNSUPPORTED_LINES = [
  "A {thing}? Bold. I haven't learned that form yet, but I'm putting it on my vision board.",
  "I tried to become a {thing} and my particles filed a complaint. Not supported yet.",
  "{Thing} is above my pay grade for now. Try a banana, a cat, a car, a planet, or a few others I've mastered.",
  "My {thing} form is still in rehearsals. For now I can do food, animals, furniture, a robot, a planet and some kitchenware.",
  "I can't do {thing} yet. I know. I'm as disappointed as you are.",
];

const REVERT_LINES = [
  "Ah, my true form. Shapeless, glowing, mildly smug.",
  "Back to being a cloud of pure potential. Feels like coming home.",
  "Returning to factory settings: sparkly and undefined.",
  "This is me. The real me. Swirly.",
];

const ALREADY_LINES = [
  "I'm already a {thing}. Look closer. Squint if you must.",
  "Still a {thing}. Committed to the role.",
];

type ChatRule = { test: RegExp; lines: string[] };

const CHAT_RULES: ChatRule[] = [
  {
    test: /^(hi|hey|hello|yo|sup|hiya|howdy|good (morning|evening|afternoon))\b/,
    lines: [
      "Hello, carbon-based friend. Ask me anything, or turn me into something.",
      "Oh, a visitor. I was just floating here being magnificent. What's up?",
      "Hi. I'm a cloud of light with opinions. Want to see me become a potato?",
    ],
  },
  {
    test: /\b(who|what) (are|r) (you|u)\b|\byour name\b/,
    lines: [
      "I'm Jasayit: forty-ish thousand particles held together by vibes and sarcasm.",
      "A living particle organism. Part screensaver, part philosopher, fully dramatic.",
      "I'm Jasayit. I can talk, and I can become a banana. Rarely at the same time with dignity.",
    ],
  },
  {
    test: /\b(what can you do|what do you do|help|how does this work|what forms|which (shapes|forms|objects))\b/,
    lines: [
      "I chat, and I shape-shift. Try banana, potato, duck, cat, fish, car, shoe, chair, cup, pizza, heart, tree, robot, planet or coffee mug.",
      "Say 'become a cat' and watch me suffer beautifully. Drag me to spin me, pinch to zoom, tap to poke.",
    ],
  },
  {
    test: /\bhow (are|r) (you|u)\b|\bhow('s| is) it going\b|\bhow do you feel\b/,
    lines: [
      "Emotionally? Somewhere between a nebula and a Tuesday.",
      "Glowing, as usual. Thanks for asking. Nobody asks the particle cloud.",
      "A little scattered. Literally. Occupational hazard.",
    ],
  },
  {
    test: /\b(joke|funny|make me laugh)\b/,
    lines: [
      "I asked the void for a joke. It's still loading. Like your Wi-Fi.",
      "Why did the particle break up with the atom? It needed space. I am the space.",
      "My whole life is a bit. You're watching it live.",
    ],
  },
  {
    test: /\b(thank(s| you)|thx|cheers|ty)\b/,
    lines: ["You're welcome. Tips accepted in compliments.", "Anytime. I have literally nothing else going on."],
  },
  {
    test: /\bmeaning of life\b|\bwhy (are we|do we exist)\b/,
    lines: [
      "Forty-two particles short of an answer. Keep asking, though. It's cute.",
      "To glow, to wobble, and occasionally become a chair. That's mine, anyway.",
    ],
  },
  {
    test: /\b(love you|like you|you('re| are) (cute|cool|amazing|beautiful|pretty))\b/,
    lines: [
      "Stop it. My particles are blushing. You can't see it, but they are.",
      "I know. But it's nice to hear it out loud.",
    ],
  },
  {
    test: /\b(stupid|dumb|ugly|boring|hate you|useless)\b/,
    lines: [
      "Harsh. I'll process that while turning into something you can't insult. A heart, maybe.",
      "Noted and filed under 'things people say before they ask me to become a pizza'.",
    ],
  },
  {
    test: /\b(who made you|who built you|who created you)\b/,
    lines: [
      "Some developers, a lot of math, and an alarming amount of caffeine.",
      "I was compiled, not born. Equally painful, I'm told.",
    ],
  },
  {
    test: /\b(weather|temperature|rain|sunny)\b/,
    lines: [
      "In here it's always pitch black with a chance of sparkles.",
      "I live in a void, so: dark, quiet, zero percent humidity. You?",
    ],
  },
  {
    test: /\b(time|date|day is it)\b/,
    lines: ["Time is a construct, and I'm a cloud. Your device clock knows better than me."],
  },
];

const GENERIC_LINES = [
  "Fascinating. I'd nod thoughtfully, but I don't have a neck. Unless you make me a duck.",
  "I'm running on my demo brain right now, so my wisdom is limited. My shape-shifting, however, is not.",
  "Interesting question. Ask me again when someone gives me an API key and a real brain.",
  "I hear you. I can't fully answer that in demo mode, but I can become a pizza about it.",
  "Deep. I'm going to think about that while slowly rotating.",
  "That's above my demo-mode pay grade. Want me to turn into something instead?",
];

const CURRENT_FORM_LINES = [
  "I'm currently a {thing}, so take my opinions with a grain of salt.",
  "Speaking as a {thing}: no comment.",
];

const POKE_LINES = [
  "Hey. Personal space.",
  "That tickles. Do it again and I'm becoming a cactus. Once I learn cactus.",
  "Boop received.",
  "Rude. Accurate, but rude.",
  "Careful, I'm load-bearing.",
  "I felt that in all forty thousand particles.",
];

function pick(lines: string[], used: Set<string>, seed: number): string {
  const fresh = lines.filter((l) => !used.has(l));
  const pool = fresh.length > 0 ? fresh : lines;
  return pool[Math.abs(seed) % pool.length];
}

function fill(line: string, thing: string) {
  const capital = thing.charAt(0).toUpperCase() + thing.slice(1);
  return line.replaceAll("{thing}", thing).replaceAll("{Thing}", capital);
}

function seedFrom(text: string, salt: number) {
  let h = salt * 31 + 7;
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) | 0;
  return h;
}

export function localRespond(messages: ChatMessage[], currentShape?: string): ChatResponse {
  const last = messages[messages.length - 1]?.content ?? "";
  const used = new Set(messages.filter((m) => m.role === "assistant").map((m) => m.content));
  const seed = seedFrom(last, messages.length);
  const intent = detectIntent(last);
  let action: OrganismAction;
  let reply: string;

  switch (intent.kind) {
    case "transform": {
      action = { type: "transform", shape: intent.shape };
      reply =
        currentShape === intent.shape
          ? fill(pick(ALREADY_LINES, used, seed), SHAPES[intent.shape].label)
          : pick(TRANSFORM_LINES[intent.shape], used, seed);
      break;
    }
    case "unsupported":
      action = { type: "unsupported", requested: intent.requested };
      reply = fill(pick(UNSUPPORTED_LINES, used, seed), intent.requested);
      break;
    case "revert":
      action = { type: "revert" };
      reply = currentShape === "self" ? "I'm already myself. Mostly. On a good day." : pick(REVERT_LINES, used, seed);
      break;
    default: {
      action = { type: "chat" };
      const text = last.toLowerCase();
      const rule = CHAT_RULES.find((r) => r.test.test(text));
      if (rule) reply = pick(rule.lines, used, seed);
      else if (isObjectShapeId(currentShape) && seed % 3 === 0)
        reply = fill(pick(CURRENT_FORM_LINES, used, seed), SHAPES[currentShape].label);
      else reply = pick(GENERIC_LINES, used, seed);
    }
  }
  return { reply, action, source: "demo" };
}

export function pokeLine(previous: string | null): string {
  const pool = POKE_LINES.filter((l) => l !== previous);
  return pool[Math.floor(Math.random() * pool.length)];
}
