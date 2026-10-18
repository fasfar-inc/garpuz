import Link from "next/link";
import { Logo } from "@/components/logo";
export default function NotFound() { return <main className="grid min-h-screen place-items-center px-5 text-center"><div><Logo /><h1 className="mt-8 text-3xl font-bold">Page not found</h1><p className="mt-2 text-[#66736B]">The page you’re looking for doesn’t exist.</p><Link href="/" className="mt-6 inline-block rounded-full bg-[#07834A] px-5 py-2.5 text-sm font-semibold text-white">Back to search</Link></div></main>; }
