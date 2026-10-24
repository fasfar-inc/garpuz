import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Heading for the screens reached from My shop, with the way back above it. */
export function PageHeading({ title, back }: { title: string; back: string }) {
  return <div className="mb-5">
    <Link href="/dashboard" className="-ml-1 inline-flex items-center gap-0.5 text-sm font-bold text-[#07834A] hover:underline"><ChevronLeft className="size-4" />{back}</Link>
    <h1 className="mt-2 text-2xl font-black tracking-tight">{title}</h1>
  </div>;
}
