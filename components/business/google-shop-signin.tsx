"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Labels = { continue: string; connecting: string; unavailable: string };

export function GoogleShopSignIn({ next = "/business/register", label, labels }: { next?: string; label?: string; labels: Labels }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function connect() {
    const supabase = createClient();
    if (!supabase) { setError(labels.unavailable); return; }
    setLoading(true);
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/business/register";
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` } });
    if (error) { setError(error.message); setLoading(false); }
  }
  return <div><button type="button" onClick={connect} disabled={loading} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#D8DFDA] bg-white px-5 text-sm font-bold text-[#26342B] shadow-sm transition hover:border-[#AFC4B7] hover:bg-[#FBFCFB] disabled:opacity-60">{loading ? <Loader2 className="size-5 animate-spin text-[#07834A]" /> : <GoogleIcon />}{loading ? labels.connecting : label ?? labels.continue}</button>{error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}</div>;
}
function GoogleIcon() { return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.32-1.93V7.46H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.54l3.35-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.46l3.35 2.61c.79-2.36 3-4.12 5.6-4.12Z"/></svg>; }
