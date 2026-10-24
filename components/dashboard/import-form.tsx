"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import { importOffers, type ImportState } from "@/app/dashboard/actions";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

const initial: ImportState = { status: "idle", created: 0, updated: 0, newProducts: 0, problems: [] };

export function ImportForm({ labels }: { labels: Dictionary["dashboard"]["import"] }) {
  const [state, action, pending] = useActionState(importOffers, initial);
  const skipped = state.problems.length;
  return <div>
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block flex-1 text-xs font-bold text-[#58665D]">{labels.file}<input name="file" type="file" accept=".csv,text/csv" required className="mt-1.5 block w-full rounded-lg border border-[#D9E1DC] bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#EAF6F0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#07834A]" /></label>
      <button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-50">{pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{pending ? labels.submitting : labels.submit}</button>
    </form>
    {state.fileError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{labels.reasons.file}</p>}
    {state.status !== "idle" && !state.fileError && <div role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${state.status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{format(labels.result, { created: state.created, updated: state.updated, skipped })}{state.newProducts > 0 && <> {format(labels.newProducts, { count: state.newProducts })}</>}</div>}
    {skipped > 0 && <div className="mt-4"><h3 className="text-sm font-bold">{labels.problems}</h3><ul className="mt-2 max-h-80 space-y-1 overflow-y-auto text-sm">{state.problems.map((problem, i) => <li key={`${problem.line}-${i}`} className="flex gap-3"><span className="w-20 shrink-0 font-semibold text-[#58665D]">{format(labels.line, { line: problem.line })}</span><span className="text-[#6B776F]">{labels.reasons[problem.reason]}</span></li>)}</ul></div>}
  </div>;
}
