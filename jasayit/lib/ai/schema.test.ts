import { describe, expect, it } from "vitest";
import { localRespond } from "./fallback";
import { chatRequestSchema, toAction } from "./schema";

describe("structured actions", () => {
  it("only morphs into whitelisted shapes", () => {
    expect(toAction({ reply: "x", action: "transform", shape: "cat", requested: "" })).toEqual({ type: "transform", shape: "cat" });
    expect(toAction({ reply: "x", action: "transform", shape: "self", requested: "" }).type).toBe("unsupported");
    expect(toAction({ reply: "x", action: "transform", shape: "<script>", requested: "dragon" })).toEqual({
      type: "unsupported",
      requested: "dragon",
    });
  });

  it("rejects requests whose last turn is not from the user", () => {
    expect(chatRequestSchema.safeParse({ messages: [{ role: "assistant", content: "hi" }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "hi" }] }).success).toBe(true);
  });
});

describe("demo brain", () => {
  it("transforms with a joke and never repeats a line already used", () => {
    const first = localRespond([{ role: "user", content: "become a banana" }], "self");
    expect(first.action).toEqual({ type: "transform", shape: "banana" });
    const second = localRespond(
      [
        { role: "user", content: "become a banana" },
        { role: "assistant", content: first.reply },
        { role: "user", content: "become a banana" },
      ],
      "potato",
    );
    expect(second.reply).not.toBe(first.reply);
  });

  it("is honest about unsupported shapes", () => {
    const r = localRespond([{ role: "user", content: "turn into a dragon" }], "self");
    expect(r.action).toEqual({ type: "unsupported", requested: "dragon" });
    expect(r.reply.toLowerCase()).toContain("dragon");
  });

  it("answers ordinary chat without morphing", () => {
    expect(localRespond([{ role: "user", content: "hello!" }], "self").action).toEqual({ type: "chat" });
  });
});
