"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Labels = Record<"shopName" | "shopNamePlaceholder" | "category" | "selectCategory" | "whatsapp" | "whatsappHint" | "city" | "selectCity" | "googleEmail" | "create" | "creating" | "errorGeneric", string>;
const selectClass = "mt-2 h-11 w-full rounded-xl border border-[#D9E1DC] bg-white px-3 text-[15px] outline-none focus:border-[#07834A]";

export function ShopSetupForm({ email, categories, cities, labels }: { email: string; categories: { value: string; label: string }[]; cities: string[]; labels: Labels }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/business/setup", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setError(data.message ?? labels.errorGeneric); setLoading(false); return; }
      router.push("/dashboard"); router.refresh();
    } catch {
      setError(labels.errorGeneric); setLoading(false);
    }
  }
  return <form action={submit} className="space-y-5">
    <label className="block text-sm font-semibold">{labels.shopName}<Input name="businessName" required minLength={2} maxLength={120} placeholder={labels.shopNamePlaceholder} className="mt-2" /></label>
    <label className="block text-sm font-semibold">{labels.category}<select name="category" required defaultValue="" className={selectClass}><option value="" disabled>{labels.selectCategory}</option>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
    <label className="block text-sm font-semibold">{labels.whatsapp}<Input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+90 533 123 45 67" className="mt-2" /><span className="mt-1.5 block text-xs font-normal text-[#7A867E]">{labels.whatsappHint}</span></label>
    <label className="block text-sm font-semibold">{labels.city}<select name="city" required defaultValue="" className={selectClass}><option value="" disabled>{labels.selectCity}</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
    <label className="block text-sm font-semibold">{labels.googleEmail}<Input value={email} readOnly className="mt-2 bg-[#F5F7F5] text-[#66736B]" /></label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? labels.creating : labels.create}</button>
  </form>;
}
