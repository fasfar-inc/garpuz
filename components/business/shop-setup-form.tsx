"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ShopSetupForm({ email, categories, labels }: { email: string; categories: { value: string; label: string }[]; labels: Dictionary["setup"] }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(formData: FormData) { setLoading(true); setError(""); const response = await fetch("/api/business/setup", { method: "POST", body: formData }); const data = await response.json().catch(() => ({})) as { message?: string }; if (!response.ok) { setError(data.message ?? labels.failed); setLoading(false); return; } router.push("/dashboard"); router.refresh(); }
  return <form action={submit} className="space-y-5"><label className="block text-sm font-semibold">{labels.shopName}<Input name="businessName" required minLength={2} maxLength={120} placeholder={labels.shopNamePlaceholder} className="mt-2" /></label><label className="block text-sm font-semibold">{labels.category}<select name="category" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#D9E1DC] bg-white px-3 text-[15px] outline-none focus:border-[#07834A]"><option value="" disabled>{labels.selectCategory}</option>{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label><label className="block text-sm font-semibold">{labels.email}<Input value={email} readOnly className="mt-2 bg-[#F5F7F5] text-[#66736B]" /></label>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? labels.submitting : labels.submit}</button></form>;
}
