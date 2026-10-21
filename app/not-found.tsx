import Link from "next/link";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getDictionary();
  return <main className="grid min-h-screen place-items-center px-5 text-center"><div><Logo /><h1 className="mt-8 text-3xl font-bold">{t.notFound.title}</h1><p className="mt-2 text-[#66736B]">{t.notFound.body}</p><Link href="/" className="mt-6 inline-block rounded-full bg-[#07834A] px-5 py-2.5 text-sm font-semibold text-white">{t.common.backToSearch}</Link></div></main>;
}
