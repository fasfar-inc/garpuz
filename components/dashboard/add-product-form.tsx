"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Package, Plus, Search, X } from "lucide-react";
import { createListing, findProducts, type ListingState } from "@/app/dashboard/actions";
import { inputClass, labelClass, primaryButton } from "@/components/dashboard/ui";
import type { CatalogMatch } from "@/lib/catalog";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/validation";

type Option = { value: string; label: string };
type Labels = Dictionary["dashboard"]["products"];
type Notices = Dictionary["dashboard"]["notices"];

/**
 * One form for every way a shop adds a listing: type what you sell, pick the matching catalog product,
 * or describe a new one, then add price and stock. Submitting by hand (not through `<form action>`)
 * keeps everything the shop typed, including the chosen photo, when the server reports a problem.
 */
export function AddProductForm({ labels, notices, conditions, availabilities, categories, defaultCategory }: {
  labels: Labels; notices: Notices; conditions: Option[]; availabilities: Option[]; categories: Option[]; defaultCategory: string;
}) {
  const [state, setState] = useState<ListingState>({});
  const [pending, startSubmit] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<CatalogMatch | null>(null);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestSearch = useRef(0);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);

  /** Looks the typed text up in the catalog a moment after the shop stops typing; older replies are ignored. */
  function search(value: string) {
    setQuery(value);
    clearTimeout(searchTimer.current);
    const term = value.trim();
    if (term.length < 2) { setResults(null); setSearching(false); return; }
    setSearching(true);
    const id = ++latestSearch.current;
    searchTimer.current = setTimeout(async () => {
      const found = await findProducts(term);
      if (id === latestSearch.current) { setResults(found); setSearching(false); }
    }, 250);
  }
  function choosePhoto(file: File | undefined) {
    setPreview(file ? URL.createObjectURL(file) : null);
  }
  function clearPhoto() {
    if (photoRef.current) photoRef.current.value = "";
    setPreview(null);
  }
  function reset() {
    setProduct(null); setCreating(false); clearPhoto();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startSubmit(async () => {
      const result = await createListing(state, data);
      setState(result);
      // Start over for the next product once a listing has been added.
      if (result.added) { form.reset(); reset(); setQuery(""); setResults(null); }
    });
  }

  const fieldLabels: Record<string, string> = { ...labels };
  const error = state.error === "invalid" ? format(notices.invalid, { field: fieldLabels[state.field ?? ""] ?? state.field ?? "" })
    : state.error ? notices[state.error as keyof Notices] ?? notices.failed : null;
  const chosen = product !== null || creating;
  const small = `${inputClass} mt-1.5`;

  return <form onSubmit={submit} className="space-y-6">
    {error && <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline-none">{error}</div>}
    {state.added && !chosen && !query && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notices.offerCreated}</div>}

    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2 text-sm font-black text-[#17211B]"><Step n={1} />{labels.stepProduct}</legend>

      {!chosen && <div>
        <span className="relative block">
          <Search className="absolute left-3 top-3 size-4 text-[#839087]" />
          <input value={query} onChange={(e) => search(e.target.value)} maxLength={100} autoComplete="off" aria-label={labels.stepProduct} placeholder={labels.findPlaceholder} className={`${inputClass} h-11 pl-9 text-[15px]`} />
          {searching && <Loader2 aria-label={labels.searching} className="absolute right-3 top-3.5 size-4 animate-spin text-[#839087]" />}
        </span>
        {results && <div className="mt-2 overflow-hidden rounded-xl border border-[#E1E7E3]">
          {results.length > 0 && <p className="bg-[#F8FAF9] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#6B776F]">{labels.inCatalog}</p>}
          <ul className="divide-y divide-[#EDF1EE]">
            {results.map((item) => <li key={item.id}><button type="button" onClick={() => setProduct(item)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F6FAF7] focus-visible:bg-[#F6FAF7] focus-visible:outline-none">
              <Thumb src={item.image_url} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name}</span><span className="block truncate text-xs text-[#6D7971]">{item.brand}{item.model ? ` · ${item.model}` : ""} · {item.category}</span></span>
              <span className="shrink-0 text-xs font-bold text-[#07834A]">{labels.pick}</span>
            </button></li>)}
            <li><button type="button" onClick={() => setCreating(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm! font-bold text-[#07834A] hover:bg-[#F6FAF7] focus-visible:bg-[#F6FAF7] focus-visible:outline-none">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-dashed border-[#9FCDB3]"><Plus className="size-4" /></span>
              {format(labels.addNew, { query: query.trim() })}
            </button></li>
          </ul>
        </div>}
        {!results && <button type="button" onClick={() => setCreating(true)} className="mt-2 text-xs! font-bold text-[#07834A] hover:underline">{labels.addNewEmpty}</button>}
      </div>}

      {product && <div className="flex items-center gap-3 rounded-xl border border-[#BFDCCB] bg-[#F3FAF6] p-3">
        <input type="hidden" name="mode" value="existing" /><input type="hidden" name="productId" value={product.id} />
        <Thumb src={product.image_url} />
        <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 truncate text-sm font-bold"><Check className="size-4 shrink-0 text-[#07834A]" />{product.name}</p><p className="truncate text-xs text-[#5F6D64]">{product.brand}{product.model ? ` · ${product.model}` : ""} · {product.category}</p></div>
        <button type="button" onClick={reset} className="shrink-0 text-xs! font-bold text-[#07834A] hover:underline">{labels.change}</button>
      </div>}

      {creating && <div className="rounded-xl border border-[#E1E7E3] p-4">
        <input type="hidden" name="mode" value="new" />
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{labels.newProduct}</p><p className="text-xs text-[#6B776F]">{labels.newProductHelp}</p></div><button type="button" onClick={reset} aria-label={labels.change} className="rounded-full p-1 text-[#6B776F] hover:bg-[#F1F4F2]"><X className="size-4" /></button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>{labels.name}<input name="name" required minLength={2} maxLength={160} defaultValue={query.trim()} className={small} /></label>
          <label className={labelClass}>{labels.brand}<input name="brand" required maxLength={100} className={small} /></label>
          <label className={labelClass}>{labels.model}<input name="model" maxLength={120} placeholder={labels.modelPlaceholder} className={small} /></label>
          <label className={labelClass}>{labels.category}<select name="category" required defaultValue={categories.some((c) => c.value === defaultCategory) ? defaultCategory : ""} className={small}><option value="" disabled>{labels.selectCategory}</option>{categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        </div>
      </div>}

      {chosen && !product?.image_url && <div className="flex items-center gap-3">
        {preview ? <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-[#E1E7E3] bg-[#F4F6F4]"><Image src={preview} alt="" fill unoptimized className="object-contain" /></span>
          : <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-dashed border-[#C9D4CD] text-[#9AA49E]"><ImagePlus className="size-5" /></span>}
        <label className={`${labelClass} min-w-0 flex-1`}>{creating ? labels.photo : labels.photoAdd}
          <input ref={photoRef} name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choosePhoto(e.target.files?.[0])} className="mt-1.5 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#EAF6F0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#07834A]" />
          <span className="mt-1 block font-normal text-[#7A857E]">{labels.photoHelp}</span>
        </label>
        {preview && <button type="button" onClick={clearPhoto} aria-label={labels.change} className="rounded-full p-1 text-[#6B776F] hover:bg-[#F1F4F2]"><X className="size-4" /></button>}
      </div>}
    </fieldset>

    {chosen && <fieldset className="space-y-3">
      <legend className="flex items-center gap-2 text-sm font-black text-[#17211B]"><Step n={2} />{labels.stepListing}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={labelClass}>{labels.price}
          <div className="mt-1.5 flex gap-2">
            <input name="price" type="number" inputMode="decimal" step="0.01" min="0" required aria-label={labels.price} className={`${inputClass} min-w-0 flex-1`} />
            <select name="currency" defaultValue="TRY" aria-label={labels.currency} className={cn(inputClass, "w-24 shrink-0")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
        </div>
        <label className={labelClass}>{labels.condition}<select name="condition" defaultValue="new" className={small}>{conditions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        <label className={labelClass}>{labels.availability}<select name="availability" defaultValue="in_stock" className={small}>{availabilities.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
        <label className={labelClass}>{labels.sku}<input name="sku" maxLength={80} className={small} /></label>
      </div>
      <button disabled={pending} className={cn(primaryButton, "w-full text-sm! sm:w-auto")}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{pending ? labels.adding : labels.addOffer}</button>
    </fieldset>}
  </form>;
}

function Step({ n }: { n: number }) {
  return <span className="grid size-6 place-items-center rounded-full bg-[#07834A] text-xs font-black text-white">{n}</span>;
}

function Thumb({ src }: { src: string | null }) {
  return <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F6F4] text-[#A7B0AA]">
    {src ? <Image src={src} alt="" fill sizes="40px" unoptimized className="object-contain p-0.5" /> : <Package className="size-5" />}
  </span>;
}
