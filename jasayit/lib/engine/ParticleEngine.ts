import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Sphere, Vector3 } from "three";
import { getShape, type ShapeId, type ShapeSource } from "../shapes/registry";
import { createRng } from "../shapes/random";
import { assignTargets, computeDelays, transitionPosition, type AssemblyStyle, type PathParams } from "./morph";
import { particleFragmentShader, particleVertexShader } from "./shaders";

export interface EngineOptions {
  count: number;
  reducedMotion: boolean;
}

export interface FrameInput {
  /** 0 calm … 1 highly excited (typing, thinking). */
  energy: number;
  /** Extra swirl speed for the idle body while it is "thinking". */
  swirlBoost: number;
  pointer: Vector3;
  pointerStrength: number;
}

const STYLES: AssemblyStyle[] = ["rise", "bloom", "sweep", "scatter"];

/**
 * Owns the particle buffers and the morph state machine. React never touches it per frame:
 * the scene calls `update()` from its render loop and UI code calls `morphTo()`.
 *
 * Every particle keeps its identity (size, twinkle, seed) for the whole session; a morph only
 * rewrites where it comes from, where it goes and when it leaves.
 */
export class ParticleEngine {
  readonly count: number;
  readonly geometry: BufferGeometry;
  readonly material: ShaderMaterial;

  private readonly from: Float32Array;
  private readonly to: Float32Array;
  private readonly rand: Float32Array;
  private readonly delay: Float32Array;
  private readonly tone: Float32Array;
  private readonly scratch: Float32Array;
  private readonly rng = createRng(7);

  private progress = 1;
  private duration = 3.2;
  private vortex = 1;
  private swirlPhase = 0;
  private toSwirl = 1;
  private turbulence = 0;
  private energy = 0;
  private pulse = 0;
  private pulseRadius = 0;
  private reducedMotion: boolean;
  private styleCursor = Math.floor(Math.random() * STYLES.length);

  current: ShapeId | string = "self";

  constructor({ count, reducedMotion }: EngineOptions) {
    this.count = count;
    this.reducedMotion = reducedMotion;
    this.from = new Float32Array(count * 3);
    this.to = new Float32Array(count * 3);
    this.rand = new Float32Array(count * 4);
    this.delay = new Float32Array(count);
    this.tone = new Float32Array(count * 2);
    this.scratch = new Float32Array(count * 3);

    for (let i = 0; i < this.rand.length; i++) this.rand[i] = this.rng();

    const self = getShape("self", count);
    // Boot from a loose cloud so the very first frame is already a "becoming".
    for (let i = 0; i < count; i++) {
      const r = 2.4 + this.rng() * 2.5;
      const a = this.rng() * Math.PI * 2;
      const z = this.rng() * 2 - 1;
      const s = Math.sqrt(1 - z * z);
      this.from[i * 3] = Math.cos(a) * s * r;
      this.from[i * 3 + 1] = z * r;
      this.from[i * 3 + 2] = Math.sin(a) * s * r;
      this.tone[i * 2] = 0;
    }
    this.to.set(self.positions);
    for (let i = 0; i < count; i++) this.tone[i * 2 + 1] = self.tones[i];
    computeDelays(this.delay, this.to, this.rand, count, "bloom");
    this.progress = 0;
    this.duration = reducedMotion ? 0.8 : 3.6;
    this.vortex = reducedMotion ? 0 : 0.7;

    this.geometry = new BufferGeometry();
    // `position` is only used for bounds; the shader reads aFrom/aTo.
    this.geometry.setAttribute("position", new BufferAttribute(this.to, 3));
    this.geometry.setAttribute("aFrom", new BufferAttribute(this.from, 3));
    this.geometry.setAttribute("aTo", new BufferAttribute(this.to, 3));
    this.geometry.setAttribute("aRand", new BufferAttribute(this.rand, 4));
    this.geometry.setAttribute("aDelay", new BufferAttribute(this.delay, 1));
    this.geometry.setAttribute("aTone", new BufferAttribute(this.tone, 2));
    // Particles roam during transitions; never let frustum culling drop the whole cloud.
    this.geometry.boundingSphere = new Sphere(new Vector3(), 6);

    this.material = new ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uVortex: { value: this.vortex },
        uSwirlPhase: { value: 0 },
        uToSwirl: { value: 1 },
        uNoiseAmp: { value: 0.03 },
        uNoiseScale: { value: 0.9 },
        uTurbulence: { value: 0 },
        uEnergy: { value: 0 },
        uBreath: { value: 0.014 },
        uPulse: { value: 0 },
        uPulseRadius: { value: 0 },
        uPointer: { value: new Vector3(99, 99, 99) },
        uPointerStrength: { value: 0 },
        uSize: { value: 0.026 },
        uScale: { value: 800 },
        uFocus: { value: 6 },
        uBrightness: { value: brightnessFor(count) },
      },
    });
  }

  get isMorphing() {
    return this.progress < 1;
  }

  /** Begin a transformation from wherever the particles are right now. */
  morphTo(source: ShapeSource | ShapeId) {
    const resolved: ShapeSource = typeof source === "string" ? { kind: "builtin", id: source } : source;
    const key = resolved.kind === "builtin" ? resolved.id : resolved.key;
    const cloud = resolved.kind === "builtin" ? getShape(resolved.id, this.count) : resolved.cloud;
    if (cloud.count !== this.count) throw new Error(`Shape "${key}" has ${cloud.count} points, expected ${this.count}`);

    // 1. Snapshot the on-screen formation (including an interrupted transition).
    const params = this.pathParams();
    for (let i = 0; i < this.count; i++) {
      const e = transitionPosition(this.scratch, i * 3, this.from, this.to, this.rand, i * 4, this.delay[i], this.progress, params);
      this.tone[i * 2] = this.tone[i * 2] + (this.tone[i * 2 + 1] - this.tone[i * 2]) * e;
    }
    this.from.set(this.scratch);

    // 2. Correspondence: neighbours on screen become neighbours in the new form.
    const assignment = assignTargets(this.from, cloud.positions, this.count);
    for (let i = 0; i < this.count; i++) {
      const j = assignment[i];
      this.to[i * 3] = cloud.positions[j * 3];
      this.to[i * 3 + 1] = cloud.positions[j * 3 + 1];
      this.to[i * 3 + 2] = cloud.positions[j * 3 + 2];
      this.tone[i * 2 + 1] = cloud.tones[j];
    }

    // 3. Choreography: how the new form assembles.
    const style: AssemblyStyle = key === "self" ? "bloom" : STYLES[this.styleCursor++ % STYLES.length];
    computeDelays(this.delay, this.to, this.rand, this.count, style);

    this.toSwirl = key === "self" ? 1 : 0;
    this.swirlPhase = 0;
    this.progress = 0;
    this.duration = this.reducedMotion ? 0.9 : 3.2;
    this.vortex = this.reducedMotion ? 0 : 1;
    this.current = key;

    for (const name of ["aFrom", "aTo", "aDelay", "aTone"]) this.geometry.getAttribute(name).needsUpdate = true;
  }

  /** Playful reaction: a ripple of light runs through the body. */
  poke() {
    this.pulse = this.reducedMotion ? 0.35 : 1;
    this.pulseRadius = 0;
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
  }

  /** Render only the first `n` particles (identities are shuffled, so any prefix is uniform). */
  setDrawCount(n: number) {
    const count = Math.max(1000, Math.min(this.count, Math.floor(n)));
    this.geometry.setDrawRange(0, count);
    this.material.uniforms.uBrightness.value = brightnessFor(count);
  }

  /** `scale` converts world size to pixels at distance 1; `focus` is the camera distance. */
  setViewport(scale: number, focus: number) {
    this.material.uniforms.uScale.value = scale;
    this.material.uniforms.uFocus.value = focus;
  }

  update(dt: number, time: number, input: FrameInput) {
    const u = this.material.uniforms;
    const step = Math.min(dt, 0.05);
    if (this.progress < 1) this.progress = Math.min(1, this.progress + step / this.duration);

    const calm = this.reducedMotion ? 0.35 : 1;
    const swirlSpeed = this.toSwirl > 0 ? (0.32 + input.swirlBoost * 1.4) * calm : 0;
    this.swirlPhase += step * swirlSpeed;

    const turbulenceTarget = this.progress < 1 ? Math.sin(Math.PI * this.progress) * this.vortex : 0;
    this.turbulence += (turbulenceTarget - this.turbulence) * (1 - Math.exp(-step * 4));
    this.energy += (input.energy * calm - this.energy) * (1 - Math.exp(-step * 3));
    this.pulse *= Math.exp(-step * 1.6);
    this.pulseRadius += step * 2.6;

    u.uTime.value = time;
    u.uProgress.value = this.progress;
    u.uVortex.value = this.vortex;
    u.uSwirlPhase.value = this.swirlPhase;
    u.uToSwirl.value = this.toSwirl;
    u.uTurbulence.value = this.turbulence;
    u.uEnergy.value = this.energy;
    u.uPulse.value = this.pulse;
    u.uPulseRadius.value = this.pulseRadius;
    // The organism's inner currents slowly change character over time.
    u.uNoiseScale.value = 0.85 + 0.35 * Math.sin(time * 0.043) + 0.15 * Math.sin(time * 0.11);
    u.uNoiseAmp.value = (this.toSwirl > 0 ? 0.045 : 0.022) * calm * (1 + 0.3 * Math.sin(time * 0.07));
    u.uBreath.value = (this.toSwirl > 0 ? 0.018 : 0.008) * calm;
    (u.uPointer.value as Vector3).copy(input.pointer);
    u.uPointerStrength.value = input.pointerStrength * calm;
  }

  private pathParams(): PathParams {
    return { vortex: this.vortex, swirlPhase: this.swirlPhase, toSwirl: this.toSwirl };
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Keep perceived brightness stable when the particle budget changes (additive blending). */
function brightnessFor(count: number) {
  return Math.min(1.4, Math.max(0.55, Math.sqrt(26000 / count) * 0.85));
}
