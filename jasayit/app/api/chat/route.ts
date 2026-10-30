import { localRespond } from "@/lib/ai/fallback";
import { hasOpenAIKey, respondWithOpenAI } from "@/lib/ai/openai";
import { chatRequestSchema, type ChatResponse } from "@/lib/ai/schema";

export async function GET() {
  return Response.json({ mode: hasOpenAIKey() ? "openai" : "demo" });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { messages, currentShape } = parsed.data;

  let result: ChatResponse;
  if (hasOpenAIKey()) {
    try {
      result = await respondWithOpenAI(messages, currentShape);
    } catch (error) {
      console.error("[jasayit] OpenAI request failed, using demo brain:", error instanceof Error ? error.message : error);
      result = localRespond(messages, currentShape);
    }
  } else {
    result = localRespond(messages, currentShape);
  }
  return Response.json(result);
}
