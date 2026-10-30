import type { ShapeId, ShapeSource } from "../shapes/registry";
import type { ParticleEngine } from "./ParticleEngine";

export interface OrganismStatus {
  shape: ShapeId | string;
  /** Canvas could not start; the chat keeps working without visuals. */
  visualsUnavailable: boolean;
}

type Listener = () => void;

/**
 * The bridge between React UI and the render loop. UI code calls intent methods; the scene
 * reads the mutable fields every frame. Only coarse status changes notify React.
 */
export class OrganismController {
  engine: ParticleEngine | null = null;

  /** Read by the render loop each frame — never trigger React renders. */
  typing = 0;
  thinking = false;
  /** Pixels of UI covering the top and bottom of the viewport; the scene centres in the rest. */
  insets = { top: 56, bottom: 160 };
  private pokeHandler: (() => void) | null = null;

  private pending: ShapeSource | ShapeId | null = null;
  private status: OrganismStatus = { shape: "self", visualsUnavailable: false };
  private listeners = new Set<Listener>();

  attach(engine: ParticleEngine) {
    this.engine = engine;
    if (this.pending) {
      engine.morphTo(this.pending);
      this.pending = null;
    }
  }

  detach(engine: ParticleEngine) {
    if (this.engine === engine) this.engine = null;
  }

  morphTo(source: ShapeSource | ShapeId) {
    const key = typeof source === "string" ? source : source.kind === "builtin" ? source.id : source.key;
    if (this.engine) this.engine.morphTo(source);
    else this.pending = source;
    this.setStatus({ shape: key });
  }

  poke() {
    this.engine?.poke();
    this.pokeHandler?.();
  }

  /** Called when a user taps the organism (the UI shows a quip). */
  setPokeHandler(handler: (() => void) | null) {
    this.pokeHandler = handler;
  }

  setTyping(level: number) {
    this.typing = level;
  }

  setThinking(value: boolean) {
    this.thinking = value;
  }

  setInsets(patch: Partial<{ top: number; bottom: number }>) {
    this.insets = { ...this.insets, ...patch };
  }

  setVisualsUnavailable(value: boolean) {
    this.setStatus({ visualsUnavailable: value });
  }

  getStatus = (): OrganismStatus => this.status;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setStatus(patch: Partial<OrganismStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((l) => l());
  }
}
