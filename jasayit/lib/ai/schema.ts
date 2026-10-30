import { z } from "zod";
import { SHAPE_IDS, isObjectShapeId, type ObjectShapeId } from "../shapes/registry";

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_HISTORY = 16;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH * 2),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1)
    .max(40)
    .refine((m) => m[m.length - 1].role === "user", "The last message must come from the user")
    .refine((m) => m[m.length - 1].content.length <= MAX_MESSAGE_LENGTH, "Message too long"),
  currentShape: z.string().max(40).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * What the organism decided to do this turn. The spoken reply is kept separate from the
 * action so the client never has to parse prose, and only whitelisted shape ids can morph.
 */
export type OrganismAction =
  | { type: "chat" }
  | { type: "transform"; shape: ObjectShapeId }
  | { type: "revert" }
  | { type: "unsupported"; requested: string };

export interface ChatResponse {
  reply: string;
  action: OrganismAction;
  source: "openai" | "demo";
}

/** Raw structured output requested from the model. */
export const modelTurnSchema = z.object({
  reply: z.string().min(1).max(600),
  action: z.enum(["chat", "transform", "revert", "unsupported"]),
  shape: z.string(),
  requested: z.string(),
});

export type ModelTurn = z.infer<typeof modelTurnSchema>;

/** JSON schema handed to the OpenAI structured-output API (strict mode). */
export const modelTurnJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "action", "shape", "requested"],
  properties: {
    reply: {
      type: "string",
      description: "What you say out loud. One or two short sentences, no emojis, no stage directions.",
    },
    action: {
      type: "string",
      enum: ["chat", "transform", "revert", "unsupported"],
      description:
        "transform: user wants a supported form. unsupported: user wants a form not in the list. revert: user wants your own body back. chat: anything else.",
    },
    shape: {
      type: "string",
      enum: [...SHAPE_IDS, "none"],
      description: "The supported form to take when action is transform, otherwise none.",
    },
    requested: {
      type: "string",
      description: "For unsupported: the thing the user asked you to become, 1-4 words. Otherwise empty.",
    },
  },
} as const;

/** Convert a validated model turn into a safe action. Never trusts free-form ids. */
export function toAction(turn: ModelTurn): OrganismAction {
  switch (turn.action) {
    case "transform":
      if (isObjectShapeId(turn.shape)) return { type: "transform", shape: turn.shape };
      return { type: "unsupported", requested: turn.requested.trim().slice(0, 40) || turn.shape.slice(0, 40) || "that" };
    case "revert":
      return { type: "revert" };
    case "unsupported":
      return { type: "unsupported", requested: turn.requested.trim().slice(0, 40) || "that" };
    default:
      return { type: "chat" };
  }
}
