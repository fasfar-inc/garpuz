import type { ReactNode } from "react";
import type { MerchantStatus } from "@/lib/admin/types";

export const tableWrap = "overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white";
export const inputClass = "h-10 rounded-lg border border-[#DCE3DF] bg-white px-3 text-sm outline-none transition placeholder:text-[#9AA49E] focus:border-[#07834A] focus:ring-2 focus:ring-[#07834A]/10";
export const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#07834A] px-4 text-sm font-bold text-white hover:bg-[#066F40] disabled:opacity-50";
export const secondaryButton = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#DCE3DF] bg-white px-3 text-xs font-bold text-[#334139] hover:border-[#9AB5A5]";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 border-b border-[#E4E9E6] bg-white px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8"><div>{eyebrow && <p className="text-xs font-bold uppercase tracking-[.15em] text-[#07834A]">{eyebrow}</p>}<h1 className="mt-1 text-2xl font-black tracking-tight text-[#17211B]">{title}</h1><p className="mt-1 text-sm text-[#6B776F]">{description}</p></div>{action}</div>;
}

export function StatusBadge({ status }: { status: MerchantStatus }) {
  const styles: Record<MerchantStatus, string> = { approved: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700", rejected: "bg-red-50 text-red-700", suspended: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${styles[status]}`}>{status}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="px-6 py-14 text-center"><p className="font-bold text-[#27332C]">{title}</p><p className="mt-1 text-sm text-[#78837C]">{description}</p></div>;
}

export function Notice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error ?? message}</div>;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function getNotice(params: Record<string, string | string[] | undefined>) {
  return { message: typeof params.notice === "string" ? params.notice : undefined, error: typeof params.error === "string" ? params.error : undefined };
}
