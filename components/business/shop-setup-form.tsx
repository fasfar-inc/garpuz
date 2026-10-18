"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
const categories = ["Electronics", "Home & Garden", "Fashion", "Automotive", "Sports", "Health & Beauty", "Groceries", "Other"];
export function ShopSetupForm({ email }: { email: string }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(formData: FormData) { setLoading(true); setError(""); const response = await fetch("/api/business/setup", { method: "POST", body: formData }); const data = await response.json() as { message?: string }; if (!response.ok) { setError(data.message ?? "Could not create your shop."); setLoading(false); return; } router.push("/dashboard"); router.refresh(); }
  return <form action={submit} className="space-y-5"><label className="block text-sm font-semibold">Shop name<Input name="businessName" required minLength={2} maxLength={120} placeholder="e.g. Kyrenia Tech" className="mt-2" /></label><label className="block text-sm font-semibold">Shop category<select name="category" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#D9E1DC] bg-white px-3 text-[15px] outline-none focus:border-[#07834A]"><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-semibold">Google email<Input value={email} readOnly className="mt-2 bg-[#F5F7F5] text-[#66736B]" /></label>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-60">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Creating your shop…" : "Create my shop"}</button></form>;
}
