"use client";

/** A submit button that asks before an action that cannot be undone. */
export function ConfirmButton({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return <button className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
