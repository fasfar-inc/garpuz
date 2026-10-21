"use client";

/** A submit button that asks for confirmation before a destructive action. */
export function ConfirmButton({ message, label, className, children }: { message: string; label: string; className: string; children: React.ReactNode }) {
  return <button type="submit" aria-label={label} title={label} className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
