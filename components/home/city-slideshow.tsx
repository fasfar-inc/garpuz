"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import type { CityPhoto } from "@/lib/home-photos";

const INTERVAL_MS = 6000;

type Labels = { pause: string; play: string; show: string; creditLabel: string };

/**
 * Crossfading city photos. Advances on its own, pauses on hover or keyboard focus and when the
 * tab is hidden, and never auto-advances for visitors who prefer reduced motion.
 */
export function CitySlideshow({ photos, labels }: { photos: CityPhoto[]; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rotating = photos.length > 1;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!rotating || paused || hovered || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % photos.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rotating, paused, hovered, reducedMotion, photos.length]);

  const current = photos[index];
  return <div className="absolute inset-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}>
    {photos.map((photo, i) => <div key={photo.src} aria-hidden={i !== index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}>
      <Image
        src={photo.src}
        alt={i === index ? photo.alt : ""}
        fill
        sizes="100vw"
        priority={false}
        className={`object-cover ${photo.mobileZoom ? "scale-[var(--zoom)] sm:scale-100" : ""}`}
        style={{ objectPosition: photo.position, transformOrigin: photo.mobileZoom?.origin, ["--zoom" as string]: photo.mobileZoom?.scale }}
      />
    </div>)}
    {/* Fade the sky into the page above, and darken the water slightly so the white text stays legible. */}
    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#fff_0%,rgba(255,255,255,0)_22%,rgba(8,40,52,0)_55%,rgba(8,40,52,.22)_80%,rgba(8,40,52,.4)_100%)]" />
    {rotating && <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 sm:bottom-3 sm:left-5">
      <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? labels.play : labels.pause} className="grid size-7 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        {paused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
      </button>
      <div className="flex items-center gap-1.5">
        {photos.map((photo, i) => <button key={photo.src} type="button" onClick={() => setIndex(i)} aria-label={labels.show.replace("{city}", photo.city)} aria-current={i === index} className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"}`} />)}
      </div>
    </div>}
    <p aria-live={rotating && !paused ? "off" : "polite"} className="absolute bottom-2 right-3 z-10 text-[11px] font-semibold text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,.6)] sm:bottom-3 sm:right-5 sm:text-[13px]">
      {current.city}
      {current.credit && <span className="font-normal text-white/75"> · {labels.creditLabel}: <a href={current.credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{current.credit.author}</a>, {current.credit.license}</span>}
    </p>
  </div>;
}
