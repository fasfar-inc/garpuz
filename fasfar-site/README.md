# FASFAR — corporate site

The official FASFAR website: Next.js App Router, TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger, and React Three Fiber / Drei.

This is a standalone app with its own dependencies, so it can move to its own repository unchanged. The parent repository's lint and typecheck exclude this folder.

The home page is one continuous scroll experience. So far it has four scenes:

1. **Hero:** ivory studio, the oversized FASFAR wordmark, and a floating chrome and glass sculpture with an entrance and idle motion.
2. **Ecosystem:** scrolling splits the sculpture into components, the stage turns midnight blue, the camera swings round, and the venture cards appear with leader lines tied to the 3D parts.
3. **Beyond the ordinary:** the cards fall away, the sculpture rises out of frame and the stage returns to warm ivory. WE THINK. / WE CREATE. / WE BUILD. are revealed one at a time at full-screen scale, with masks, perspective and a fill wipe. They then settle into an asymmetric composition with the headline, the supporting text and a magnetic "Discover FASFAR" button, while chrome, pearl and glass pieces float into the gaps.

4. **Our Ventures:** BIG IDEAS. / DIFFERENT WORLDS. rises in, and its ink sweeps into the ventures' brand colours. Each venture then takes the stage in turn, with its own visual, entrance and scroll-driven story:
   - GARDAŞ: a floating 3D phone with a route drawing across a map.
   - GARPUZ: its real wordmark, watermelon emblem and product imagery, around a price-comparison card that steps through products.
   - MenuFlex: a phone menu that changes category, and a QR card that scans on hover.
   - FFMate: a conversation that builds up next to a luminous automation flow.

   "Explore …" opens a side sheet with the venture's details, without leaving your place in the story.

Every transition is scrubbed by the scroll, so scrolling back up reverses it.

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
  ventures.ts            Venture registry: cards, showcase data (industry, description, colours,
                         logo, media, visual, url, page), sculpture anchors
  site.ts                Navigation, copy, chapters (progress rail)
lib/stage/
  store.ts               Shared state between the GSAP timeline and WebGL (no React renders on scroll)
  phases.ts              Timeline segments and where each beat sits in them (used by DOM and 3D)
  levels.ts              Derived values shared by DOM and 3D (night level, Scene 3 phase progress)
  layout.ts              Responsive sculpture placement per scene, Scene 3 floater slots
lib/motion/
  use-magnetic.ts        Desktop-only magnetic cursor pull
components/
  experience/home-stage  Pins the stage, runs the scroll timeline, entrance, hash links
  scenes/                DOM layers per scene: backdrop, hero, ecosystem, persistent chrome
  three/                 Canvas, camera rig, lighting/stars, sculpture (parts are data in parts.ts), Scene 3 floaters
  showcase/              Scene 4: orchestrator, intro, panel, details sheet, recipes.ts
                         (per-visual choreography) and visuals/ (one per venture type)
  ventures/              Venture card, marks (Scene 2), official logos
  layout/, ui/           Header, wordmark, buttons, icons
```

How the layers fit together:

- One scrubbed ScrollTrigger timeline animates the DOM. It is split into segments, one per scene transition, each sized by its scroll distance (`SEGMENT_VH`). Each segment's 0 → 1 progress goes to the stage store (`progress`, `outro`).
- Scenes 1 and 2 snap to whichever scene you scroll towards. Scene 3 is read continuously, so it doesn't snap.
- The WebGL scene reads that progress inside `useFrame`, so the two layers stay in sync without React re-rendering on scroll.
- The canvas is transparent and sits between the wordmark and the copy, so the sculpture floats in front of the typography.
- The glass is a Fresnel material rather than a transmission pass, which keeps it cheap on mobile.

## Extending

- **New venture:** add an entry to `content/ventures.ts`. It appears in Scenes 2 and 4 automatically. Pick an existing showcase `visual` or add a new type to `ShowcaseVisual`, with a component in `components/showcase/visuals/` and a recipe in `recipes.ts`. Until a type has both, it falls back to a generic brand-coloured visual.
  - Only official assets go in `logo` and `media`. Without a logo, the name is set in type.
  - Only set `url` once it's a verified live destination; `page` points at a dedicated page on this site. Unset links are simply not shown.
  - Ecosystem extras: optionally add its mark in `components/ventures/venture-mark.tsx`; without one it falls back to a monogram. `anchor` picks the sculpture part its leader line attaches to. The ecosystem scene places up to six featured ventures; add a slot in `ecosystem-scene.tsx` to show more.
- **New page:** add a route under `app/` and give its nav item an `href` in `content/site.ts`. Items without an `href` render as "coming soon".
- **New home scene:** append a chapter in `content/site.ts`, add a segment (`SEGMENT_VH`) and its phases in `phases.ts`, add a DOM layer under `components/scenes/`, and add its tweens after the last segment in `home-stage.tsx`. Earlier segments keep their timing, so existing scenes don't change.
- **Re-shape the sculpture:** edit the assembled and exploded poses in `components/three/sculpture/parts.ts`.

Scene 4 has two layouts, chosen with `gsap.matchMedia`:
- **Desktop:** the ventures are full-screen layers handed over by one pinned, scrubbed timeline (one unit per venture).
- **Mobile, and reduced motion at any size:** the same panels in a vertical showcase, each animating as it scrolls in.

Both are built from the same recipes. Product tiles and menu tabs scroll the story to that step, so clicking and scrolling never disagree.

Visuals of interfaces that don't exist yet are marked "Concept visual". Prices, shops and dishes are marked "Illustrative".

## Performance and accessibility

- The canvas loads client-side only. It pauses when off screen and drops to 1× DPR if the frame rate falls. Phones get lower-detail geometry and fewer stars.
- With `prefers-reduced-motion`, there is no entrance animation, idle motion, snapping, magnetic pull, Scene 3 zoom or Scene 4 pinning. Venture content fades rather than flies, frames render on demand, and scrolling still moves between the scenes.
- Scene 4 is DOM and CSS 3D only. The WebGL canvas pauses once the stage has scrolled away.
- Venture cards are keyboard-focusable. Focusing or hovering a card highlights its part of the sculpture, and hovering a part highlights its card.
- The figures beside the hero are counted from the registry. Nothing is hard-coded.
