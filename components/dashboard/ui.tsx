import { CheckCircle2, CircleAlert } from "lucide-react";
import type { MerchantStatus } from "@/lib/admin/types";

export const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-[#D9E1DC] bg-white px-3 text-[15px] text-[#17211B] outline-none transition placeholder:text-[#849087] focus:border-[#07834A] focus:ring-3 focus:ring-[#07834A]/10";
export const labelClass = "block text-sm font-semibold text-[#2E3B33]";
export const cardClass = "rounded-2xl border border-[#E1E7E3] bg-white";
export const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white transition hover:bg-[#056B3D] disabled:opacity-60";
export const outlineButton = "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D9E1DC] bg-white px-5 text-sm font-semibold text-[#2E3B33] transition hover:border-[#07834A] hover:text-[#07834A]";

export function PageHeader({ eyebrow, title, action, status, statusLabel }: { eyebrow?: string; title: string; action?: React.ReactNode; status?: MerchantStatus; statusLabel?: string }) {
  return <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#E3E9E5] bg-white px-5 py-3 sm:px-8">
    <div className="min-w-0">{eyebrow && <p className="text-xs text-[#78847C]">{eyebrow}</p>}<h1 className="truncate font-bold">{title}</h1></div>
    <div className="flex items-center gap-3">{action}{status && <StatusPill status={status} label={statusLabel ?? status} />}</div>
  </header>;
}

export function StatusPill({ status, label }: { status: MerchantStatus; label: string }) {
  const tone = status === "approved" ? "bg-[#EAF6F0] text-[#07834A]" : status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}>{label}</span>;
}

export function Notice({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;
  return <div role={error ? "alert" : "status"} className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
    {error ? <CircleAlert className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}{error ?? notice}
  </div>;
}

/** Reads a known message key from the URL and returns its translated text. */
export function pickMessage(params: Record<string, string | string[] | undefined>, key: "notice" | "error", messages: Record<string, string | undefined>) {
  const value = params[key];
  return typeof value === "string" ? messages[value] : undefined;
}
