"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { saveProduct } from "@/app/dashboard/actions";
import { FieldError, FormError } from "@/components/dashboard/ui";
import { inputClass, labelClass, primaryButton } from "@/components/dashboard/styles";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Labels = Dictionary["dashboard"]["product"];

/**
 * Product name, price in lira and an optional photo. Submitting by hand rather than through
 * `<form action>` keeps what was typed, including the chosen photo, when there is an error.
 */
export function ProductForm({ labels, initial }: {
  labels: Labels;
  initial?: { id: string; name: string; price: string; image: string | null };
}) {
  const [state, dispatch, pending] = useActionState(saveProduct, {});
  const [, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const errors = state.errors ?? {};
  const message = (key?: string) => key && (labels.errors[key as keyof Labels["errors"]] ?? labels.errors.failed);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(file: File | undefined) {
    setPreview(file ? URL.createObjectURL(file) : null);
  }
  function clearPhoto() {
    if (photoRef.current) photoRef.current.value = "";
    setPreview(null);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }
  const field = (name: string) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : `${name}-help` });
  // A shop's photo only fills in a product that has none, so an existing photo is shown, not replaced.
  const shown = preview ?? initial?.image ?? null;

  return <form onSubmit={submit} noValidate className="space-y-5">
    <FormError message={message(errors.form)} />
    {initial && <input type="hidden" name="id" value={initial.id} />}

    <label className={labelClass}>{labels.name}
      <input name="name" required minLength={2} maxLength={160} autoComplete="off" defaultValue={initial?.name} placeholder={labels.namePlaceholder} className={cn(inputClass, "mt-2")} {...field("name")} />
      {errors.name ? <FieldError id="name-error" message={message(errors.name === "invalid" ? "name" : errors.name)} /> : <span id="name-help" className="mt-1.5 block text-xs font-normal text-[#6B776F]">{labels.nameHelp}</span>}
    </label>

    <label className={labelClass}>{labels.price}
      <span className="relative mt-2 block">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-bold text-[#07834A]">₺</span>
        <input name="price" required inputMode="decimal" autoComplete="off" maxLength={20} defaultValue={initial?.price} placeholder="0" className={cn(inputClass, "pl-9 text-[17px] font-semibold")} {...field("price")} />
      </span>
      <FieldError id="price-error" message={errors.price ? message("price") : undefined} />
    </label>

    <div>
      <p className={labelClass}>{labels.photo}</p>
      <div className="mt-2 flex items-center gap-4">
        <span className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[#C9D4CD] bg-[#F7F9F8] text-[#9AA49E]">
          {shown ? <Image src={shown} alt="" fill sizes="96px" unoptimized className="object-contain p-1" /> : <ImagePlus className="size-7" />}
        </span>
        {!initial?.image && <div className="min-w-0 space-y-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-[#BFDCCB] bg-[#EAF6F0] px-4 text-sm font-bold text-[#07834A] focus-within:ring-3 focus-within:ring-[#07834A]/20 hover:bg-[#DDF0E6]">
            {labels.choosePhoto}
            <input ref={photoRef} name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choose(e.target.files?.[0])} className="sr-only" {...field("photo")} />
          </label>
          {preview && <button type="button" onClick={clearPhoto} className="flex items-center gap-1 text-xs! font-bold text-[#5D6A62] hover:text-red-700"><X className="size-3.5" />{labels.removePhoto}</button>}
          <p id="photo-help" className="text-xs text-[#6B776F]">{labels.photoHelp}</p>
        </div>}
      </div>
      <FieldError id="photo-error" message={errors.photo ? message(errors.photo) : undefined} />
    </div>

    <button disabled={pending} className={cn(primaryButton, "w-full")}>{pending && <Loader2 className="size-4 animate-spin" />}{pending ? labels.saving : labels.save}</button>
  </form>;
}
