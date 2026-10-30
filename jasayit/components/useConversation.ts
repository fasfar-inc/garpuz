"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localRespond } from "@/lib/ai/fallback";
import { MAX_HISTORY, MAX_MESSAGE_LENGTH, type ChatResponse, type OrganismAction } from "@/lib/ai/schema";
import type { OrganismController } from "@/lib/engine/controller";

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  action?: OrganismAction;
}

let nextId = 1;

/**
 * Message → server (structured reply + action) → transcript + morph.
 * The action is applied only from a validated, whitelisted response.
 */
export function useConversation(controller: OrganismController) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<"openai" | "demo" | null>(null);
  const history = useRef<Message[]>([]);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/chat", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { mode?: "openai" | "demo" }) => setMode(d.mode ?? "demo"))
      .catch(() => {});
    return () => {
      ctrl.abort();
      abort.current?.abort();
    };
  }, []);

  const apply = useCallback(
    (action: OrganismAction) => {
      if (action.type === "transform") controller.morphTo(action.shape);
      else if (action.type === "revert") {
        if (controller.getStatus().shape !== "self") controller.morphTo("self");
      } else if (action.type === "unsupported") controller.engine?.poke();
    },
    [controller],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!text || pending) return;
      const user: Message = { id: nextId++, role: "user", content: text };
      history.current = [...history.current, user];
      setMessages(history.current);
      setPending(true);
      controller.setThinking(true);

      const payload = {
        messages: history.current.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content })),
        currentShape: String(controller.getStatus().shape),
      };
      let result: ChatResponse;
      try {
        abort.current = new AbortController();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abort.current.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        result = (await response.json()) as ChatResponse;
        if (typeof result.reply !== "string" || !result.action) throw new Error("Malformed reply");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        // Offline or server trouble: the local brain keeps the organism alive.
        result = localRespond(payload.messages, payload.currentShape);
        setMode("demo");
      } finally {
        controller.setThinking(false);
        setPending(false);
      }

      const reply: Message = { id: nextId++, role: "assistant", content: result.reply, action: result.action };
      history.current = [...history.current, reply];
      setMessages(history.current);
      apply(result.action);
    },
    [apply, controller, pending],
  );

  return { messages, pending, mode, send };
}
