import type { ReactNode } from "react";
import type { MerchantStatus } from "@/lib/admin/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/dictionaries";

export const inputClass = "h-10 w-full rounded-lg border border-[#D9E1DC] bg-white px-3 text-sm outline-none transition placeholder:text-[#9AA49E] focus:border-[#07834A] focus:ring-2 focus:ring-[#07834A]/10 disabled:bg-[#F5F7F5] disabled:text-[#7A857E]";
export const labelClass = "block text-xs font-bold text-[#58665D]";
export const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-50";
export const cardClass = "rounded-2xl border border-[#E1E7E3] bg-white";

export function DashboardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 border-b border-[#E3E9E5] bg-white px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8"><div><h1 className="text-2xl font-black tracking-tight">{title}</h1>{description && <p className="mt-1 text-sm text-[#68766D]">{description}</p>}</div>{action}</div>;
}

export function MerchantStatusBadge({ status, t }: { status: MerchantStatus; t: Dictionary }) {
  const styles: Record<MerchantStatus, string> = { approved: "bg-[#EAF6F0] text-[#07834A]", pending: "bg-amber-50 text-amber-700", rejected: "bg-red-50 text-red-700", suspended: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${styles[status]}`}>{t.status[status]}</span>;
}

const NOTICE_KEYS = ["saved", "offerCreated", "offerUpdated", "offerDeleted", "documentUploaded"] as const;
const ERROR_KEYS = ["offerDuplicate", "documentInvalid", "failed", "notFound"] as const;

/** Renders the outcome of a server action, which is passed back as `?notice=` or `?error=` codes. */
export function DashboardNotice({ params, t }: { params: Record<string, string | string[] | undefined>; t: Dictionary }) {
  const n = t.dashboard.notices;
  const notice = typeof params.notice === "string" && (NOTICE_KEYS as readonly string[]).includes(params.notice) ? n[params.notice as (typeof NOTICE_KEYS)[number]] : null;
  let error: string | null = null;
  if (typeof params.error === "string") {
    if ((ERROR_KEYS as readonly string[]).includes(params.error)) error = n[params.error as (typeof ERROR_KEYS)[number]];
    else if (params.error.startsWith("invalid:")) {
      const field = params.error.slice("invalid:".length);
      const labels: Record<string, string> = { ...t.dashboard.profile, ...t.dashboard.products };
      error = format(n.invalid, { field: labels[field] ?? field });
    } else error = n.failed;
  }
  if (!notice && !error) return null;
  return <div role={error ? "alert" : "status"} className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error ?? notice}</div>;
}

export function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
