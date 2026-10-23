import Image from "next/image";

/** The rolling pixel watermelon shown while search results or pages load. */
export function WatermelonLoader({ label, overlay = false }: { label: string; overlay?: boolean }) {
  return <div role="status" aria-live="polite" className={overlay ? "fixed inset-0 z-50 grid place-items-center bg-white/85 backdrop-blur-sm" : "grid min-h-screen place-items-center bg-white"}>
    <div className="flex flex-col items-center gap-3">
      <div className="size-14 overflow-hidden motion-safe:animate-melon-hop motion-reduce:animate-pulse sm:size-16">
        <Image src="/watermelon-roll.png" alt="" width={1536} height={128} priority unoptimized className="h-full w-[1200%] max-w-none [image-rendering:pixelated] motion-safe:animate-melon-roll" />
      </div>
      <p className="text-sm font-semibold text-[#07834A]">{label}</p>
    </div>
  </div>;
}
