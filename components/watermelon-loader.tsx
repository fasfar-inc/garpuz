import Image from "next/image";

/** The swinging watermelon shown while search results or pages load. */
export function WatermelonLoader({ label, overlay = false }: { label: string; overlay?: boolean }) {
  return <div role="status" aria-live="polite" className={overlay ? "fixed inset-0 z-50 grid place-items-center bg-white/85 backdrop-blur-sm" : "grid min-h-screen place-items-center bg-white"}>
    <div className="flex flex-col items-center gap-4">
      <Image src="/watermelon-spin.png" alt="" width={96} height={96} priority className="size-20 origin-bottom motion-safe:animate-swing motion-reduce:animate-pulse sm:size-24" />
      <p className="text-sm font-semibold text-[#07834A]">{label}</p>
    </div>
  </div>;
}
