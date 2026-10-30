"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { pokeLine } from "@/lib/ai/fallback";
import { OrganismController } from "@/lib/engine/controller";
import { detectDeviceProfile, detectWebGL, prefersReducedMotion } from "@/lib/engine/device";
import { getShape, isShapeId, SHAPE_IDS } from "@/lib/shapes/registry";
import { ChatDock } from "./ui/ChatDock";
import { Header } from "./ui/Header";
import { useConversation } from "./useConversation";

const OrganismCanvas = dynamic(() => import("./scene/OrganismCanvas"), { ssr: false });

/** Client-only root (mounted with ssr: false): the canvas, the organism and the chat. */
export default function Experience() {
  const [controller] = useState(() => new OrganismController());
  const [profile] = useState(detectDeviceProfile);
  const [webgl] = useState(detectWebGL);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [aside, setAside] = useState<string | null>(null);
  const status = useSyncExternalStore(controller.subscribe, controller.getStatus, controller.getStatus);
  const conversation = useConversation(controller);
  const headerRef = useRef<HTMLElement>(null);
  const asideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A quick aside line for taps and hints; it is not part of the conversation.
  const say = useCallback((line: string) => {
    setAside(line);
    clearTimeout(asideTimer.current);
    asideTimer.current = setTimeout(() => setAside(null), 3200);
  }, []);

  useEffect(() => {
    let last: string | null = null;
    controller.setPokeHandler(() => {
      last = pokeLine(last);
      say(last);
    });
    return () => {
      controller.setPokeHandler(null);
      clearTimeout(asideTimer.current);
    };
  }, [controller, say]);

  // Warm the shape cache while idle so the first transformations start instantly.
  useEffect(() => {
    let cancelled = false;
    const queue = [...SHAPE_IDS];
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(cb, { timeout: 2000 })
        : window.setTimeout(cb, 200);
    const warm = () => {
      if (cancelled) return;
      const id = queue.shift();
      if (!id) return;
      getShape(id, profile.particles);
      idle(warm);
    };
    const start = window.setTimeout(() => idle(warm), 1500);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [profile.particles]);

  // Debug/demo hook: `?shape=cat` starts in that form; window.jasayit drives the engine.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("shape");
    if (isShapeId(initial) && initial !== "self") controller.morphTo(initial);
    (window as unknown as { jasayit?: unknown }).jasayit = {
      morphTo: (id: string) => isShapeId(id) && controller.morphTo(id),
      poke: () => controller.poke(),
      get status() {
        return controller.getStatus();
      },
    };
  }, [controller]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      controller.setInsets({ top: el.getBoundingClientRect().bottom });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [controller]);

  const showVisualFallback = !webgl || status.visualsUnavailable;

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 touch-none select-none" aria-hidden="true">
        {webgl && (
          <CanvasBoundary onError={() => controller.setVisualsUnavailable(true)}>
            <OrganismCanvas controller={controller} profile={profile} reducedMotion={reducedMotion} />
          </CanvasBoundary>
        )}
      </div>

      {showVisualFallback && (
        <div className="pointer-events-none absolute inset-x-6 top-1/3 text-center text-sm leading-relaxed text-white/45">
          My particles can&apos;t render on this device right now (WebGL is unavailable).
          <br />I&apos;m still here in spirit, and the chat still works.
        </div>
      )}

      <Header ref={headerRef} shape={status.shape} mode={conversation.mode} />
      <ChatDock
        controller={controller}
        messages={conversation.messages}
        pending={conversation.pending}
        aside={aside}
        onSend={conversation.send}
        onMic={() => say("Voice is coming soon. I'm still practising my speaking voice.")}
      />
      <span className="sr-only" aria-live="polite">
        {isShapeId(status.shape) && status.shape !== "self" ? `Jasayit is now a ${status.shape}` : ""}
      </span>
    </main>
  );
}

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[jasayit] renderer failed:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
