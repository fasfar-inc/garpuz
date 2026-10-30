"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_MESSAGE_LENGTH, type OrganismAction } from "@/lib/ai/schema";
import type { OrganismController } from "@/lib/engine/controller";
import { SHAPES } from "@/lib/shapes/registry";
import type { Message } from "../useConversation";

const EXAMPLES = ["Turn into a banana", "Become a Ferrari", "What are you, exactly?"];
const TYPING_IDLE_MS = 1100;

interface Props {
  controller: OrganismController;
  messages: Message[];
  pending: boolean;
  aside: string | null;
  onSend: (text: string) => void;
  onMic: () => void;
}

export function ChatDock({ controller, messages, pending, aside, onSend, onMic }: Props) {
  const [draft, setDraft] = useState("");
  const dockRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Tell the scene how much of the screen the dock covers so the organism stays clear of it.
  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const update = () => {
      const covered = window.innerHeight - el.getBoundingClientRect().top;
      controller.setInsets({ bottom: Math.max(0, covered) });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      clearTimeout(typingTimer.current);
    };
  }, [controller]);

  const onDraft = (value: string) => {
    setDraft(value);
    controller.setTyping(value.length > 0 ? 1 : 0);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => controller.setTyping(0), TYPING_IDLE_MS);
  };

  const submit = (text: string) => {
    if (!text.trim() || pending) return;
    onSend(text);
    setDraft("");
    controller.setTyping(0);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };

  const recent = messages.slice(-3);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div
      ref={dockRef}
      className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-2 text-center" aria-live="polite">
        {recent.map((m, i) => {
          const age = recent.length - 1 - i;
          return m.role === "user" ? (
            <p
              key={m.id}
              className="max-w-full truncate text-[13px] text-white/35 transition-opacity duration-500"
              style={{ opacity: age === 0 ? 1 : 0.55 }}
            >
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="flex flex-col items-center gap-1" style={{ opacity: age === 0 ? 1 : 0.4 }}>
              <Reveal text={m.content} className="text-[15px] leading-snug text-white/90 sm:text-base" />
              {m === lastAssistant && m.action && <ActionTag action={m.action} />}
            </div>
          );
        })}
        {pending && <ThinkingDots />}
        <p className="h-5 text-[13px] italic text-white/45 transition-opacity duration-500" style={{ opacity: aside ? 1 : 0 }}>
          {aside}
        </p>
      </div>

      {messages.length === 0 && (
        <div className="mb-3 mt-1 flex max-w-xl flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => submit(example)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition hover:border-white/25 hover:text-white/85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-1 flex w-full max-w-xl items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-5 pr-1.5 shadow-[0_0_40px_rgba(140,170,255,0.05)] backdrop-blur-md transition focus-within:border-white/25"
      >
        <label htmlFor="jasayit-input" className="sr-only">
          Message Jasayit
        </label>
        <input
          id="jasayit-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onBlur={() => controller.setTyping(0)}
          maxLength={MAX_MESSAGE_LENGTH}
          autoComplete="off"
          enterKeyHint="send"
          placeholder="Ask me anything. Or turn me into something."
          className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
        />
        <IconButton label="Voice input (coming soon)" onClick={onMic} muted>
          <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
          <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
        </IconButton>
        <IconButton label="Send" type="submit" disabled={!draft.trim() || pending}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </IconButton>
      </form>
    </div>
  );
}

function IconButton({
  label,
  children,
  muted,
  ...props
}: { label: string; muted?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-30 ${
        muted ? "text-white/40 hover:text-white/70" : "bg-white/10 text-white/85 hover:bg-white/20"
      }`}
      {...props}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function ActionTag({ action }: { action: OrganismAction }) {
  let text: string | null = null;
  if (action.type === "transform") text = `becoming ${SHAPES[action.shape].label}`;
  else if (action.type === "revert") text = "back to myself";
  else if (action.type === "unsupported") text = `${action.requested}: not in my repertoire yet`;
  if (!text) return null;
  return <span className="text-[10px] uppercase tracking-[0.28em] text-white/30">{text}</span>;
}

/** Word-by-word fade in, like a line being spoken. */
function Reveal({ text, className }: { text: string; className?: string }) {
  const words = text.split(/\s+/);
  return (
    <p className={className}>
      {words.map((word, i) => (
        <span key={i} className="reveal-word" style={{ animationDelay: `${i * 45}ms` }}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

function ThinkingDots() {
  return (
    <div className="flex h-5 items-center gap-1.5" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="thinking-dot h-1 w-1 rounded-full bg-white/60" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}
