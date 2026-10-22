import Image from "next/image";
import { MapPin } from "lucide-react";
import { NORTH_CYPRUS_PHOTO } from "@/lib/home-photos";

export function NorthCyprus({ title, tagline, creditLabel }: { title: string; tagline: string; creditLabel: string }) {
  const photo = NORTH_CYPRUS_PHOTO;
  return <section aria-label={title} className="relative mt-8 h-[172px] overflow-hidden sm:mt-12 sm:h-[272px]">
    {photo
      ? <>
        <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: photo.position }} />
        {/* Fade the sky into the page above, and darken the water slightly so the white text stays legible. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#fff_0%,rgba(255,255,255,.4)_16%,rgba(255,255,255,0)_38%,rgba(8,40,52,.18)_75%,rgba(8,40,52,.38)_100%)]" />
      </>
      // Until a photo is added: a sky-to-sea gradient in the same palette.
      : <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#fff_0%,#e3f1ee_22%,#9fcfcf_52%,#3f93a3_80%,#2a7489_100%)]" />}
    <div className="absolute inset-x-0 bottom-[22px] flex flex-col items-center px-5 text-center sm:bottom-[42px]">
      <p className="inline-flex h-[38px] items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-[#17211B] shadow-[0_6px_20px_rgba(10,30,40,.18)] sm:h-[52px] sm:gap-2.5 sm:px-6 sm:text-[18px]"><MapPin className="size-[18px] fill-[#07834A] text-white sm:size-6" strokeWidth={2} aria-hidden="true" />{title}</p>
      <p className="mt-2.5 text-[14px] font-medium text-white [text-shadow:0_1px_8px_rgba(0,30,40,.55)] sm:mt-4 sm:text-[19px]">{tagline}</p>
    </div>
    {photo && <p className="absolute bottom-1 right-2 text-[9px] text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,.6)] sm:text-[10px]">{creditLabel}: <a href={photo.credit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{photo.credit.author}</a>, {photo.credit.license}</p>}
  </section>;
}
