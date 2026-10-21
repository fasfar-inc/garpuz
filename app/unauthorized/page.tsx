import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { GoogleShopSignIn } from "@/components/business/google-shop-signin";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: "Admin access required", robots: { index: false, follow: false } };

export default async function UnauthorizedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams; const reason = typeof params.reason === "string" ? params.reason : "forbidden"; const signin = reason === "signin";
  return <main className="grid min-h-screen place-items-center bg-[#F5F7F6] p-5"><section className="w-full max-w-md rounded-2xl border border-[#E0E6E2] bg-white p-8 text-center shadow-[0_14px_45px_rgba(20,31,24,.06)]"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#EDF7F1] text-[#07834A]"><ShieldX className="size-6" /></span><h1 className="mt-5 text-2xl font-black tracking-tight">{signin ? "Administrator sign-in" : reason === "configuration" ? "Admin setup incomplete" : "Access not authorized"}</h1><p className="mt-2 text-sm leading-6 text-[#68756C]">{signin ? "Sign in with the Google account that has been assigned the trusted administrator role." : reason === "configuration" ? "The server-side Supabase configuration is unavailable. Contact the project owner." : "Your account is signed in but does not have the administrator role. Access is never granted based on email alone."}</p>{signin && <div className="mt-6"><GoogleShopSignIn next="/admin" label="Sign in with Google" labels={dictionaries.en.google} /></div>}<Link href="/" className="mt-6 inline-block text-sm font-bold text-[#07834A]">Return to product search</Link></section></main>;
}
