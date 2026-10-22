import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CookingPot, Gamepad2, Headphones, Laptop, Smartphone, Tv, type LucideIcon } from "lucide-react";
import { categoryHref, FEATURED_CATEGORIES } from "@/lib/categories";

const ICONS: Record<string, LucideIcon> = {
  "Mobile Phones": Smartphone, Computers: Laptop, Gaming: Gamepad2, Electronics: Tv, Accessories: Headphones, "Home Appliances": CookingPot,
};

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
  return <Link href={categoryHref(name)} className="group flex h-full flex-col items-center justify-center rounded-xl bg-[#F3F4F3] px-1.5 pb-2 pt-2 text-center transition hover:bg-[#ECEFED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/50 sm:rounded-2xl sm:pb-4 sm:pt-4">
    <span className="relative mx-auto block aspect-[5/4] w-[90%] sm:aspect-square sm:w-[80%]">
      {image
        ? <Image src={image} alt="" fill sizes="(min-width: 1024px) 130px, (min-width: 640px) 25vw, 30vw" className="object-contain transition duration-300 group-hover:scale-[1.04]" />
        : <CategoryIcon name={name} label={label} />}
    </span>
    <span className="mt-1 whitespace-nowrap text-[11.5px] font-medium leading-tight text-[#17211B] sm:mt-3 sm:text-[15px]">{label}</span>
  </Link>;
}

function CategoryIcon({ name, label }: { name: string; label: string }) {
  const Icon = ICONS[name];
  return <span aria-hidden="true" className="grid size-full place-items-center">
    {Icon
      ? <Icon className="size-[46%] text-[#07834A] transition duration-300 group-hover:scale-[1.06]" strokeWidth={1.4} />
      : <span className="text-[28px] font-black text-[#9FB3A6] sm:text-[36px]">{label.charAt(0).toLocaleUpperCase()}</span>}
  </span>;
}
