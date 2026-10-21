"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Loader2, Upload } from "lucide-react";
import { importCatalog, type ImportState } from "@/app/dashboard/actions";

type Labels = Record<"file" | "upload" | "uploading" | "resultTitle" | "created" | "updated" | "failed" | "row" | "failedRows" | "errorFile" | "errorEmpty" | "errorHeaders" | "errorTooMany" | "errorServer" | "viewProducts", string>;

const initial: ImportState = { status: "idle", created: 0, updated: 0, failed: [] };

export function ImportForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(importCatalog, initial);
  return <div>
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block flex-1 text-sm font-semibold text-[#2E3B33]">{labels.file}
        <input type="file" name="file" accept=".csv,text/csv" required className="mt-1.5 block w-full rounded-xl border border-dashed border-[#C9D5CD] bg-[#FAFCFB] p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#EAF6F0] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#07834A]" />
      </label>
      <button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#07834A] px-5 text-sm font-bold text-white hover:bg-[#056B3D] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{pending ? labels.uploading : labels.upload}</button>
    </form>

    {state.status === "error" && state.message && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><CircleAlert className="size-4 shrink-0" />{labels[state.message]}</p>}

    {state.status === "done" && <div role="status" className="mt-5 rounded-xl border border-[#D7E7DD] bg-[#F3F8F5] p-4">
      <p className="flex items-center gap-2 font-bold"><CircleCheck className="size-5 text-[#07834A]" />{labels.resultTitle}</p>
      <p className="mt-2 text-sm text-[#3D4B42]"><b>{state.created}</b> {labels.created} · <b>{state.updated}</b> {labels.updated} · <b className={state.failed.length ? "text-red-700" : ""}>{state.failed.length}</b> {labels.failed}</p>
      {(state.created > 0 || state.updated > 0) && <Link href="/dashboard/products" className="mt-3 inline-block text-sm font-bold text-[#07834A]">{labels.viewProducts} →</Link>}
    </div>}

    {state.failed.length > 0 && <div className="mt-4 overflow-hidden rounded-xl border border-red-200">
      <p className="bg-red-50 px-4 py-2 text-sm font-bold text-red-800">{labels.failedRows}</p>
      <ul className="max-h-72 divide-y divide-red-100 overflow-y-auto text-sm">{state.failed.map((f) => <li key={`${f.row}-${f.reason}`} className="flex gap-3 px-4 py-2"><span className="w-16 shrink-0 font-bold text-[#56645B]">{labels.row} {f.row}</span><span className="text-[#3D4B42]">{f.reason}</span></li>)}</ul>
    </div>}
  </div>;
}
