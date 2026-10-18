import Link from "next/link";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return <main className="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <section className="mx-auto flex w-full max-w-[620px] flex-1 flex-col items-center justify-center px-5 pb-24 pt-10 text-center sm:pb-28">
      <Logo large />
      <p className="mt-3 text-[15px] text-[#66736B] sm:text-base">Find it locally. Compare prices.</p>
      <div className="mt-8 w-full"><SearchBox /></div>
    </section>
    <footer className="border-t border-[#EDF0EE] bg-white px-5 py-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#68766D] sm:justify-between">
        <span>© {new Date().getFullYear()} Garpuz</span>
        <nav className="flex gap-5"><Link href="/about">About Garpuz</Link><Link href="/business/register">Add your shop</Link><a href="mailto:hello@garpuz.com">Contact</a><span>EN / TR</span></nav>
      </div>
    </footer>
  </main>;
}
