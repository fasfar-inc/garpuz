# FASFAR — corporate site

The official FASFAR website: Next.js App Router, TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger, and React Three Fiber / Drei.

This is a standalone app with its own dependencies, so it can move to its own repository unchanged. The parent repository's lint and typecheck exclude this folder.

Phase 1 delivers the first two scenes of the home page:

1. **Hero:** ivory studio, the oversized FASFAR wordmark, and a floating chrome and glass sculpture with an entrance and idle motion.
2. **Ecosystem:** scrolling splits the sculpture into components, the stage turns midnight blue, the camera swings round, and the venture cards appear with leader lines tied to the 3D parts. Scrolling back up reverses all of it.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## Architecture

```
content/                 What the site says: edit these to change the site
  ventures.ts            Venture registry: cards, marks, sculpture anchors
  site.ts                Navigation, copy, chapters (progress rail)
lib/stage/
  store.ts               Shared state between the GSAP timeline and WebGL (no React renders on scroll)
  phases.ts              Where each beat of the transition sits on the 0 → 1 timeline (used by DOM and 3D)
  layout.ts              Responsive sculpture placement per scene
components/
  experience/home-stage  Pins the stage, runs the scroll timeline, entrance, hash links
  scenes/                DOM layers per scene: backdrop, hero, ecosystem, persistent chrome
  three/                 Canvas, camera rig, lighting/stars, sculpture (parts are data in parts.ts)
  ventures/              Venture card + marks
  layout/, ui/           Header, wordmark, buttons, icons
```

How the layers fit together:

- One scrubbed ScrollTrigger timeline animates the DOM and writes its progress to the stage store.
- The WebGL scene reads that progress inside `useFrame`, so the two layers stay in sync without React re-rendering on scroll.
- The canvas is transparent and sits between the wordmark and the copy, so the sculpture floats in front of the typography.
- The glass is a Fresnel material rather than a transmission pass, which keeps it cheap on mobile.

## Extending

- **New venture:** add an entry to `content/ventures.ts`. Optionally add its mark in `components/ventures/venture-mark.tsx`; without one it falls back to a monogram. `anchor` picks the sculpture part its leader line attaches to. The ecosystem scene places up to six featured ventures; add a slot in `ecosystem-scene.tsx` to show more.
- **New page:** add a route under `app/` and give its nav item an `href` in `content/site.ts`. Items without an `href` render as "coming soon".
- **New home scene:** append a chapter in `content/site.ts`, add its beats to `phases.ts`, and add a DOM layer under `components/scenes/`.
- **Re-shape the sculpture:** edit the assembled and exploded poses in `components/three/sculpture/parts.ts`.

## Performance and accessibility

- The canvas loads client-side only. It pauses when off screen and drops to 1× DPR if the frame rate falls. Phones get lower-detail geometry and fewer stars.
- With `prefers-reduced-motion`, there is no entrance animation, idle motion or snapping; frames render on demand, and scrolling still moves between the scenes.
- Venture cards are keyboard-focusable. Focusing or hovering a card highlights its part of the sculpture, and hovering a part highlights its card.
- The figures beside the hero are counted from the registry. Nothing is hard-coded.
