"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1.5 text-sm font-medium text-red-600">{message}</p> : null;
}

export function FormError({ message }: { message?: string }) {
  return message ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message}</p> : null;
}

/** A button for a plain server-action form that shows a spinner and blocks double taps while it runs. */
export function SubmitButton({ children, className, confirm }: { children: React.ReactNode; className?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-busy={pending} className={cn("inline-flex items-center justify-center gap-1.5 disabled:opacity-60", className)}
    onClick={(event) => { if (confirm && !window.confirm(confirm)) event.preventDefault(); }}>
    {pending && <Loader2 className="size-3.5 animate-spin" />}{children}
  </button>;
}
