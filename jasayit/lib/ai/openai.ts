import OpenAI from "openai";
import { buildSystemPrompt } from "./persona";
import { MAX_HISTORY, modelTurnJsonSchema, modelTurnSchema, toAction, type ChatMessage, type ChatResponse } from "./schema";

/** Server-side only: talks to OpenAI with a strict JSON schema and validates the result. */

let client: OpenAI | null = null;

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient() {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 1 });
  return client;
}

export async function respondWithOpenAI(messages: ChatMessage[], currentShape?: string): Promise<ChatResponse> {
  const completion = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(currentShape) },
      ...messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "organism_turn", strict: true, schema: modelTurnJsonSchema },
    },
    max_completion_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  // The model's output is data: parsed, validated, and mapped onto a whitelist. Never executed.
  const turn = modelTurnSchema.parse(JSON.parse(content));
  return { reply: turn.reply.trim(), action: toAction(turn), source: "openai" };
}
