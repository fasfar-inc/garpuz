import { MapPin } from "lucide-react";
import { CitySlideshow } from "@/components/home/city-slideshow";
import { CITY_PHOTOS } from "@/lib/home-photos";

type Labels = { pause: string; play: string; show: string };

export function NorthCyprus({ title, tagline, creditLabel, slideshow }: { title: string; tagline: string; creditLabel: string; slideshow: Labels }) {
  return <section aria-label={title} aria-roledescription={CITY_PHOTOS.length > 1 ? "carousel" : undefined} className="relative mt-8 h-[196px] overflow-hidden sm:mt-12 sm:h-[272px]">
    {CITY_PHOTOS.length
      ? <CitySlideshow photos={CITY_PHOTOS} labels={{ ...slideshow, creditLabel }} />
      // Until a photo is added: a sky-to-sea gradient in the same palette.
      : <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,#fff_0%,#e3f1ee_22%,#9fcfcf_52%,#3f93a3_80%,#2a7489_100%)]" />}
    <div className="pointer-events-none absolute inset-x-0 bottom-[30px] flex flex-col items-center px-5 text-center sm:bottom-[46px]">
      <p className="inline-flex h-[38px] items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-[#17211B] shadow-[0_6px_20px_rgba(10,30,40,.18)] sm:h-[52px] sm:gap-2.5 sm:px-6 sm:text-[18px]"><MapPin className="size-[18px] fill-[#07834A] text-white sm:size-6" strokeWidth={2} aria-hidden="true" />{title}</p>
      <p className="mt-2.5 text-[14px] font-medium text-white [text-shadow:0_1px_8px_rgba(0,30,40,.55)] sm:mt-4 sm:text-[19px]">{tagline}</p>
    </div>
  </section>;
}
