"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/app/dashboard/actions";
import { FieldError, FormError } from "@/components/dashboard/ui";
import { inputClass, labelClass, primaryButton } from "@/components/dashboard/styles";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { CITIES } from "@/lib/validation";

type Labels = Dictionary["setup"];
type Shop = { businessName: string; city: string; whatsapp: string };

/**
 * Shop name, town and WhatsApp number: the whole form for creating a shop and for editing it.
 * Submitting by hand rather than through `<form action>` keeps what was typed when there is an error.
 */
export function ShopForm({ action, labels, submitLabel, pendingLabel, initial }: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  labels: Labels; submitLabel: string; pendingLabel: string; initial?: Shop;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [, startTransition] = useTransition();
  const errors = state.errors ?? {};
  const message = (field: string) => errors[field] && (labels.errors[field as keyof Labels["errors"]] ?? labels.errors.failed);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }
  const field = (name: string) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined });

  return <form onSubmit={submit} noValidate className="space-y-5">
    <FormError message={errors.form && (labels.errors[errors.form as keyof Labels["errors"]] ?? labels.errors.failed)} />
    <label className={labelClass}>{labels.shopName}
      <input name="businessName" required minLength={2} maxLength={120} autoComplete="organization" defaultValue={initial?.businessName} placeholder={labels.shopNamePlaceholder} className={cn(inputClass, "mt-2")} {...field("businessName")} />
      <FieldError id="businessName-error" message={message("businessName")} />
    </label>
    <label className={labelClass}>{labels.city}
      <select name="city" required defaultValue={initial?.city ?? ""} className={cn(inputClass, "mt-2")} {...field("city")}>
        <option value="" disabled>{labels.selectCity}</option>
        {CITIES.map((city) => <option key={city}>{city}</option>)}
      </select>
      <FieldError id="city-error" message={message("city")} />
    </label>
    <label className={labelClass}>{labels.whatsapp}
      <input name="whatsapp" type="tel" required inputMode="tel" autoComplete="tel" maxLength={20} defaultValue={initial?.whatsapp} placeholder="+90 533 123 45 67" className={cn(inputClass, "mt-2")} {...field("whatsapp")} />
      {errors.whatsapp ? <FieldError id="whatsapp-error" message={message("whatsapp")} /> : <span className="mt-1.5 block text-xs font-normal text-[#6B776F]">{labels.whatsappHelp}</span>}
    </label>
    <button disabled={pending} className={cn(primaryButton, "w-full")}>{pending && <Loader2 className="size-4 animate-spin" />}{pending ? pendingLabel : submitLabel}</button>
  </form>;
}
