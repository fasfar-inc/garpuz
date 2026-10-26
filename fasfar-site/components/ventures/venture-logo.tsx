import Image from "next/image";
import type { Venture } from "@/content/ventures";
import { cn } from "@/lib/cn";

/**
 * Official logos only. Coded wordmarks reproduce a venture's own logo
 * implementation; image logos come from `venture.logo`. Ventures without an
 * official logo get their name set in the site typeface — never an invented mark.
 */
const wordmarks: Record<string, (props: { className?: string }) => React.ReactNode> = {
  // As implemented in the GARPUZ product (components/logo.tsx in the GARPUZ app).
  garpuz: ({ className }) => (
    <span className={cn("inline-flex items-end whitespace-nowrap font-black leading-none tracking-[-0.045em] text-[#07834A]", className)}>
      GARPUZ
      <span aria-hidden="true" className="mb-[0.16em] ml-[0.05em] inline-block size-[0.15em] rounded-full bg-[#F2414F]" />
    </span>
  ),
};

export function VentureLogo({ venture, className }: { venture: Venture; className?: string }) {
  const logo = venture.logo;
  if (logo && "wordmark" in logo && logo.wordmark && wordmarks[logo.wordmark]) {
    const Wordmark = wordmarks[logo.wordmark];
    return (
      <span role="img" aria-label={venture.name}>
        <Wordmark className={className} />
      </span>
    );
  }
  if (logo && "src" in logo) {
    return <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className={cn("h-[1em] w-auto", className)} />;
  }
  return <span className={className}>{venture.name}</span>;
}

export const hasOfficialLogo = (venture: Venture) => Boolean(venture.logo);
