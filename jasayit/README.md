# Jasayit

A living organism made of tens of thousands of glowing particles. Chat with it, ask it to
turn into something, and it physically re-forms itself, while complaining about it.

Everything on screen is a real-time WebGL particle system: no video, no sprites, no CSS tricks.
Every form is built from the same particles, which travel to their new positions through a
scatter → vortex → assemble transition.

## Run it

```bash
cd jasayit
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY for the real brain
npm run dev                  # http://localhost:3000
```

Without `OPENAI_API_KEY` the app runs in **demo mode**: the same structured flow is answered by
a built-in, hand-written repertoire (`lib/ai/fallback.ts`), and a small `DEMO` marker shows in the
corner. If the OpenAI call fails at runtime, the server falls back to the demo brain too, and so
does the client when the network is down.

| Variable         | Default        | Purpose                                                       |
| ---------------- | -------------- | ------------------------------------------------------------- |
| `OPENAI_API_KEY` | (none)         | Enables model replies. Read on the server only.               |
| `OPENAI_MODEL`   | `gpt-4.1-mini` | Any chat model that supports JSON-schema structured outputs.  |

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`, `npm test`.

### Handy URL parameters

- `?shape=cat` starts directly in a form.
- `?particles=20000` overrides the automatic particle budget (2,000 to 120,000).
- In the console, `jasayit.morphTo("robot")` and `jasayit.poke()` drive the organism directly.

## Interacting

- Type anything. Requests like "turn into a banana", "become a Ferrari" or "can you be a kitten?"
  transform it; "turn back" / "be yourself" returns it to its own body.
- Supported forms: banana, potato, duck, cat, fish, car, shoe, chair, cup, pizza, heart, tree,
  robot, planet, coffee mug. Synonyms work (Ferrari → car, kitten → cat, Saturn → planet, …).
- Unsupported forms ("become a dragon") get a playful refusal and a small shudder. It never
  pretends to transform.
- Drag to rotate (with inertia), pinch or scroll to zoom (clamped), tap to poke it.
- Typing excites the particles and makes the organism lean toward you; while it is thinking, its
  currents speed up.

## How it works

```
app/
  page.tsx, layout.tsx       client-only experience mounted from a server page
  api/chat/route.ts          POST: validated chat turn → structured reply; GET: demo/openai mode
components/
  Experience.tsx             canvas + UI shell, WebGL fallback, idle shape pre-warming
  useConversation.ts         message → server → transcript + morph
  scene/                     React Three Fiber: Organism, CameraRig, PerformanceGovernor, Dust
  ui/                        Header, ChatDock (input, mic placeholder, examples, subtitles)
lib/
  shapes/                    procedural point-cloud library
    geometry.ts              primitives: lathe, tube with radius profile, extrude, radial/implicit
    builder.ts               area-weighted surface sampling + volumes, normalisation
    catalog.ts               one recipe per form (and the idle organism)
    registry.ts              ids, aliases, presentation tilt, cached generation
  engine/
    ParticleEngine.ts        buffers + morph state machine (no React)
    morph.ts                 transition path, correspondence, assembly choreography
    shaders.ts               GLSL: transition, simplex flow-noise, breathing, ripples, glow
    controller.ts            UI ↔ render-loop bridge (no per-frame React renders)
    device.ts                WebGL detection, particle budget, reduced motion
  ai/
    schema.ts                request/response schemas, strict JSON schema, action whitelist
    persona.ts               system prompt
    openai.ts                server-only model call
    intent.ts, fallback.ts   demo brain: intent parsing + varied replies
```

### Shapes

Each form is composed from real 3D geometry (lathes, tubes that follow curves with a varying
radius, extrusions, implicit surfaces like the Taubin heart, lumpy radial bodies), then sampled
into exactly _N_ points by surface area × density. Per-point **tone** gives features like eyes,
headlights, pepperoni and planet bands extra glow. Shapes are generated lazily per particle
budget, cached, and pre-warmed during idle time.

### Morphing engine

- Every particle keeps its identity (size, twinkle, seed) for the whole session. A morph only
  rewrites `aFrom`, `aTo`, `aDelay` and `aTone` in place; buffers are never reallocated.
- **Correspondence:** current positions and the target cloud are both ordered along a Morton
  (Z-order) curve, and the k-th particle takes the k-th target point, so neighbours travel together.
- **Path** (identical in `morph.ts` and the vertex shader): eased interpolation with a
  per-particle sine bump that pushes particles outward (destabilise / scatter), spins them
  around the vertical axis faster near the centre (vortex), and stretches them vertically.
- **Choreography:** staggered start delays assemble the new form bottom-up, centre-out, as a
  sweep or as a scatter, rotating through these styles.
- **Interruptions:** asking for a new form mid-transition snapshots each particle's exact on-screen
  position on the CPU and starts from there. There are no pops.
- **Life:** simplex flow-noise whose scale drifts over time, a breathing wave, per-particle
  micro-orbits, differential swirl inside the idle body, pointer repulsion and tap ripples, all
  driven by smoothed uniforms so they never jump.

### AI turn

The model is asked for strict JSON: `{ reply, action: chat | transform | revert | unsupported, shape, requested }`.
The server validates it with zod and maps it onto a whitelist (`toAction`). Only known shape ids
can ever morph, and model output is treated purely as data, never executed. History (last 16 turns)
and the current form are sent with each request, so the conversation keeps its context.

### Extending to generated shapes

The engine accepts any `ShapeSource`. Today that is `{ kind: "builtin", id }`, but
`{ kind: "points", key, cloud }` already works with any `PointCloud` of the engine's size. A future
text-to-3D or mesh-upload step only needs to produce points (e.g. sample a mesh with
`PointCloudBuilder.surface`) and return them alongside an `unsupported` → `generated` action.

### Performance

- Particle budget is picked per device: about 42k on desktop, 15–24k on mobile, 12k on software
  renderers. A governor first lowers the pixel ratio, then the draw range, if the frame rate drops
  below 50 FPS. Particles are shuffled, so any prefix of the buffer is a uniform subset.
- All animation runs in the vertex shader; JavaScript only updates a dozen uniforms per frame.
  React does not re-render per frame.
- A morph costs one CPU pass over the buffers (about 15–20 ms at 42k particles).
- Engine geometry and materials are disposed on unmount. WebGL context loss and renderer errors
  fall back to a text note while chat keeps working, and devices without WebGL get the same note.
- `prefers-reduced-motion` turns off the vortex and scatter, shortens morphs, calms the noise,
  rotation and float, and disables text animations.

## Tests

`npm test` covers every shape (full budget, finite, framed, genuinely 3D, distinct, deterministic),
the morph math (exact start/end, vortex deviation, permutation correspondence), intent parsing for
all 15 forms plus synonyms, unsupported requests, reverts and plain chat, the action whitelist,
and the demo brain's non-repetition.
