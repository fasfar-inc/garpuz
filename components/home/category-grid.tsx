import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryHref, FEATURED_CATEGORIES } from "@/lib/categories";

type Labels = { heading: string; headingShort: string; viewAll: string; viewAllShort: string; names: Record<string, string> };

export function CategoryGrid({ labels }: { labels: Labels }) {
  return <section aria-labelledby="categories-heading" className="mt-8 border-t border-[#E9EDEA] pt-6 sm:mt-14 sm:pt-9">
    <div className="flex items-baseline justify-between gap-4">
      <h2 id="categories-heading" className="text-[16px] font-bold text-[#17211B] sm:text-[22px]"><span className="sm:hidden">{labels.headingShort}</span><span className="hidden sm:inline">{labels.heading}</span></h2>
      <Link href="/categories" className="inline-flex shrink-0 items-center gap-1.5 rounded text-[14px] font-medium text-[#07834A] hover:text-[#056B3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40 sm:text-[16px]">
        <span className="sm:hidden">{labels.viewAllShort}</span><span className="hidden sm:inline">{labels.viewAll}</span><ArrowRight className="size-4" strokeWidth={2} />
      </Link>
    </div>
    <ul className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-2.5 lg:grid-cols-6">
      {FEATURED_CATEGORIES.map((category) => <li key={category.name}><CategoryCard name={category.name} label={labels.names[category.name] ?? category.name} image={category.image} /></li>)}
    </ul>
  </section>;
}

export function CategoryCard({ name, label, image }: { name: string; label: string; image?: string }) {
  return <Link href={categoryHref(name)} className="group flex h-full flex-col items-center rounded-[14px] bg-[#F3F4F3] px-2 pb-3 pt-3 text-center transition hover:bg-[#ECEFED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/50 sm:rounded-2xl sm:pb-4 sm:pt-4">
    <span className="relative block aspect-square w-[78%] sm:w-[80%]">
      {image
        ? <Image src={image} alt="" fill sizes="(min-width: 1024px) 130px, (min-width: 640px) 25vw, 30vw" className="object-contain mix-blend-multiply transition duration-300 group-hover:scale-[1.04]" />
        : <span className="grid size-full place-items-center rounded-xl bg-white/60 text-2xl font-black text-[#B9C4BD]">{label.charAt(0)}</span>}
    </span>
    <span className="mt-2 whitespace-nowrap text-[11.5px] font-medium leading-tight text-[#17211B] sm:mt-3 sm:text-[15px]">{label}</span>
  </Link>;
}
