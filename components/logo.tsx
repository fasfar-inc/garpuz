import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ large = false, className }: { large?: boolean; className?: string }) {
  return <Link href="/" className={cn("inline-flex items-center font-black leading-none tracking-[-0.055em] text-[#07834A]", large ? "text-[52px] sm:text-[72px]" : "text-[23px]", className)} aria-label="Garpuz home">GARPUZ<span className="ml-1 size-2 rounded-full bg-[#FF4054] sm:size-2.5" /></Link>;
}
