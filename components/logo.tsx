import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ large = false, className }: { large?: boolean; className?: string }) {
  if (large) {
    // Homepage wordmark: the red dot sits just above the baseline, sized relative to the text.
    return <Link href="/" className={cn("inline-block whitespace-nowrap font-black tracking-[-0.045em] text-[#07834A] text-[54px] sm:text-[86px] lg:text-[106px] leading-none", className)} aria-label="Garpuz home">GARPUZ<span aria-hidden="true" className="ml-[0.05em] mb-[0.16em] inline-block size-[0.15em] rounded-full bg-[#F2414F]" /></Link>;
  }
  return <Link href="/" className={cn("inline-flex items-center font-black leading-none tracking-[-0.055em] text-[#07834A] text-[23px]", className)} aria-label="Garpuz home">GARPUZ<span className="ml-1 size-2 rounded-full bg-[#FF4054] sm:size-2.5" /></Link>;
}
