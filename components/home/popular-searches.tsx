import Link from "next/link";
import { POPULAR_SEARCHES } from "@/lib/popular-searches";

export function PopularSearches({ heading }: { heading: string }) {
  return <section aria-labelledby="popular-searches" className="mt-7 w-full sm:mt-9">
    <h2 id="popular-searches" className="text-left text-[13px] text-[#6B776F] sm:text-center sm:text-[14px]">{heading}</h2>
    <ul className="mt-2.5 flex flex-wrap gap-2 sm:mt-3 sm:justify-center sm:gap-2.5">
      {POPULAR_SEARCHES.map(({ query, short }) => <li key={query}>
        <Link href={{ pathname: "/search", query: { q: query } }} className="inline-flex h-[31px] items-center rounded-full border border-transparent bg-[#F1F3F2] px-3.5 text-[12px] font-medium text-[#26322B] shadow-[0_1px_2px_rgba(23,33,27,.04)] transition hover:border-[#9EC9B1] hover:text-[#07834A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40 sm:h-[38px] sm:border-[#E1E6E3] sm:bg-white sm:px-4 sm:text-[14px]">
          {short ? <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{query}</span></> : query}
        </Link>
      </li>)}
    </ul>
  </section>;
}
