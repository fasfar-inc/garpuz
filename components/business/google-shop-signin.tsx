"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Labels = { continue: string; connecting: string; unavailable: string; failed: string };

type GoogleCredential = { credential: string };
type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: GoogleCredential) => void; nonce: string; ux_mode: "popup"; context: "signin" }) => void;
  renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
};
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }

const GSI_SRC = "https://accounts.google.com/gsi/client";

function safePath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/business/register";
}

/** A random nonce for Supabase and its SHA-256 hex digest for Google, which puts the digest in the ID token. */
async function makeNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce)));
  return { nonce, hashed: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("") };
}

let gsiScript: Promise<GoogleId> | null = null;
function loadGsi() {
  gsiScript ??= new Promise<GoogleId>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const script = document.createElement("script");
    script.src = GSI_SRC; script.async = true;
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("Google sign-in did not load")));
    script.onerror = () => { gsiScript = null; reject(new Error("Google sign-in did not load")); };
    document.head.appendChild(script);
  });
  return gsiScript;
}

/**
 * Google sign-in for shops. With a Google client ID it uses Google's own button on this site, so Google's
 * sign-in screen names GARPUZ's address rather than the Supabase project's; the ID token is then handed to
 * Supabase. Without one, or if Google's script cannot load, it falls back to Supabase's redirect sign-in.
 */
export function GoogleShopSignIn({ next = "/business/register", clientId, locale = "en", label, labels }: { next?: string; clientId?: string; locale?: string; label?: string; labels: Labels }) {
  const [mode, setMode] = useState<"loading" | "google" | "redirect">(clientId ? "loading" : "redirect");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const buttonRef = useRef<HTMLDivElement>(null);
  const target = safePath(next);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const [gsi, { nonce, hashed }] = await Promise.all([loadGsi(), makeNonce()]);
        if (cancelled || !buttonRef.current) return;
        gsi.initialize({
          client_id: clientId, nonce: hashed, ux_mode: "popup", context: "signin",
          callback: async ({ credential }) => {
            const supabase = createClient();
            if (!supabase) { setError(labels.unavailable); return; }
            setBusy(true); setError("");
            const { error: signInError } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce });
            if (signInError) { console.error("Google sign-in failed", signInError.message); setBusy(false); setError(labels.failed); setMode("redirect"); return; }
            // A full page load so the server sees the new session cookie and routes to the shop form or My shop.
            window.location.assign(target);
          },
        });
        gsi.renderButton(buttonRef.current, { type: "standard", theme: "outline", size: "large", shape: "pill", text: label ? "signin_with" : "continue_with", logo_alignment: "center", width: Math.min(400, buttonRef.current.offsetWidth || 320), locale });
        setMode("google");
      } catch {
        if (!cancelled) setMode("redirect");
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, locale, label, target, labels.unavailable, labels.failed]);

  async function redirectSignIn() {
    const supabase = createClient();
    if (!supabase) { setError(labels.unavailable); return; }
    setBusy(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}` } });
    if (oauthError) { setError(oauthError.message); setBusy(false); }
  }

  return <div>
    {mode !== "redirect" && <div className="relative flex min-h-12 justify-center">
      <div ref={buttonRef} className={`w-full max-w-[400px] ${busy ? "invisible" : ""}`} />
      {(mode === "loading" || busy) && <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-bold text-[#26342B]"><Loader2 className="size-5 animate-spin text-[#07834A]" />{busy ? labels.connecting : ""}</span>}
    </div>}
    {mode === "redirect" && <button type="button" onClick={redirectSignIn} disabled={busy} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#D8DFDA] bg-white px-5 text-sm! font-bold text-[#26342B] shadow-sm transition hover:border-[#AFC4B7] hover:bg-[#FBFCFB] disabled:opacity-60">{busy ? <Loader2 className="size-5 animate-spin text-[#07834A]" /> : <GoogleIcon />}{busy ? labels.connecting : label ?? labels.continue}</button>}
    {error && <p role="alert" className="mt-3 text-center text-xs text-red-600">{error}</p>}
  </div>;
}
function GoogleIcon() { return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.32-1.93V7.46H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.54l3.35-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.46l3.35 2.61c.79-2.36 3-4.12 5.6-4.12Z"/></svg>; }
