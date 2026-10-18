import type { Metadata } from "next";
import Link from "next/link";
import { Search, Store } from "lucide-react";
import { Logo } from "@/components/logo";
import { GoogleShopSignIn } from "@/components/business/google-shop-signin";

export const metadata: Metadata = { title: "Add your shop" };

export default function RegisterPage() {
  return <main className="flex min-h-screen flex-col bg-white">
    <header className="border-b border-[#E7ECE8]"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><Logo /><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#526057] hover:text-[#07834A]"><Search className="size-4" /> Find a product</Link></div></header>
    <section className="grid flex-1 place-items-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#EAF6F0] text-[#07834A]"><Store className="size-6" /></div>
        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Add your shop to Garpuz</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-[#66736B]">Connect your Google account, add your shop name and category, and start listing products.</p>
        <div className="mt-8"><GoogleShopSignIn /></div>
        <p className="mt-5 text-xs leading-5 text-[#839087]">Just looking for a product? You never need an account.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-bold text-[#07834A] hover:underline">Search products freely</Link>
      </div>
    </section>
  </main>;
}
