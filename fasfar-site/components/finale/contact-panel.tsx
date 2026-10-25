"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { contact, contactCategories, type ContactCategoryId } from "@/content/finale";
import { cn } from "@/lib/cn";
import { getContactIntent } from "@/lib/contact/intent";
import { HONEYPOT_FIELD, LIMITS, validateContact, type ContactField, type ContactResponse, type FieldErrors } from "@/lib/contact/schema";
import { ArrowUpRight } from "@/components/ui/icons";

export type PanelOrigin = { x: number; y: number };

const CLOSE_MS = 650;
const ENDPOINT = "/api/contact";
const pad = (n: number) => String(n).padStart(2, "0");

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

type Values = { name: string; email: string; company: string; message: string };
const EMPTY: Values = { name: "", email: "", company: "", message: "" };

const ERROR_COPY: Record<string, string> = {
  unavailable: contact.unavailable,
  rate_limited: "Several messages have been sent from here in a short time. Please try again a little later.",
  rejected: "Your message couldn’t be sent. Please reload the page and try again.",
  delivery_failed: "Your message couldn’t be delivered just now. Nothing was sent — please try again in a moment.",
  network: "We couldn’t reach the server. Nothing was sent — please check your connection and try again.",
};

/**
 * The contact experience. A native modal dialog (focus trap, Esc, inert
 * page) that opens as a circle growing out of the button that summoned it.
 * Choose what the message is about, and the form unfolds. The form only
 * reports success when the API confirms the inquiry was accepted.
 */
export function ContactPanel({ origin, onClose }: { origin: PanelOrigin | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [closing, setClosing] = useState(false);
  const [shownAt, setShownAt] = useState<PanelOrigin | null>(null);
  const [category, setCategory] = useState<ContactCategoryId | null>(null);
  const [preselected, setPreselected] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [available, setAvailable] = useState<boolean | null>(null);
  const startedAt = useRef(0);
  const id = useId();

  // Keep the panel on screen (and positioned) while its exit plays.
  if (origin && origin !== shownAt) {
    setShownAt(origin);
    setClosing(false);
    // Start where the visitor already pointed in Scene 7.
    const intent = getContactIntent();
    if (intent && !category) {
      setCategory(intent);
      setPreselected(true);
    }
  }

  useEffect(() => {
    const el = dialog.current;
    if (!el || !origin) return;
    if (!el.open) el.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const checked = el.querySelector<HTMLInputElement>('input[name="category"]:checked') ?? el.querySelector<HTMLInputElement>('input[name="category"]');
      checked?.focus({ preventScroll: true });
    });

    // Ask the server whether delivery is configured before anyone writes a long message.
    const ctrl = new AbortController();
    fetch(ENDPOINT, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d: { available?: boolean }) => setAvailable(d.available === true))
      .catch(() => !ctrl.signal.aborted && setAvailable(false));

    return () => {
      ctrl.abort();
      root.style.overflow = previous;
    };
  }, [origin]);

  useEffect(() => {
    if (category && !startedAt.current) startedAt.current = Date.now();
  }, [category]);

  const close = () => {
    if (closing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    window.setTimeout(
      () => {
        dialog.current?.close();
        setClosing(false);
        setShownAt(null);
        // A sent message starts over next time; an unsent draft is kept.
        if (status.kind === "sent") {
          setValues(EMPTY);
          setCategory(null);
          setPreselected(false);
          setTouched({});
          setStatus({ kind: "idle" });
          startedAt.current = 0;
        }
        onClose();
      },
      reduced ? 0 : CLOSE_MS,
    );
  };

  const fieldErrors = (next: Values, cat: ContactCategoryId | null) => {
    const result = validateContact({ ...next, category: cat ?? "" });
    return result.ok ? {} : result.errors;
  };

  const update = (field: keyof Values, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field has been left (or a submit tried), keep its message current.
    if (touched[field]) setErrors((prev) => ({ ...prev, [field]: fieldErrors(next, category)[field] }));
  };

  const blur = (field: keyof Values) => {
    if (!values[field] && !touched[field]) return;
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: fieldErrors(values, category)[field] }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status.kind === "sending") return;
    if (available === false) {
      setStatus({ kind: "error", message: contact.unavailable });
      return;
    }
    const found = fieldErrors(values, category);
    setTouched({ name: true, email: true, company: true, message: true, category: true });
    setErrors(found);
    const first = (["category", "name", "email", "company", "message"] as ContactField[]).find((f) => found[f]);
    if (first) {
      const selector = first === "category" ? 'input[name="category"]' : `[name="${first}"]`;
      dialog.current?.querySelector<HTMLElement>(selector)?.focus();
      setStatus({ kind: "error", message: `Please check the highlighted field${Object.keys(found).length > 1 ? "s" : ""}.` });
      return;
    }

    setStatus({ kind: "sending" });
    const honeypot = (form.current?.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, category, startedAt: startedAt.current, [HONEYPOT_FIELD]: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as ContactResponse | null;
      if (res.ok && data?.ok === true) {
        setStatus({ kind: "sent" });
        return;
      }
      if (data && !data.ok && data.error === "invalid") {
        setErrors(data.errors);
        setStatus({ kind: "error", message: "Please check the highlighted fields." });
        return;
      }
      if (data && !data.ok && data.error === "unavailable") setAvailable(false);
      setStatus({ kind: "error", message: ERROR_COPY[data && !data.ok ? data.error : "delivery_failed"] ?? ERROR_COPY.delivery_failed });
    } catch {
      setStatus({ kind: "error", message: ERROR_COPY.network });
    }
  };

  const o = shownAt ?? { x: 0, y: 0 };
  const selected = contactCategories.find((c) => c.id === category);
  const sent = status.kind === "sent";

  return (
    <dialog
      ref={dialog}
      data-closing={closing || undefined}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby={`${id}-title`}
      style={{ ["--cx" as string]: `${o.x}px`, ["--cy" as string]: `${o.y}px` }}
      className="contact-panel fixed inset-0 m-0 h-svh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-[#050a1c] p-0 text-[#eef1f8] backdrop:bg-transparent"
    >
      {shownAt && (
        <div className="relative min-h-full">
          {/* Architecture: thin lines and a soft light, as in the finale. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-[20%] top-[-30%] h-[90vh] w-[90vh] rounded-full bg-[radial-gradient(circle,rgba(125,156,255,0.16),rgba(125,156,255,0)_65%)]" />
            <span className="absolute inset-y-0 left-[4.2vw] hidden w-px bg-white/[0.07] md:block" />
            <span className="absolute inset-y-0 left-1/2 hidden w-px bg-white/[0.07] md:block" />
          </div>

          <div className="relative mx-auto flex min-h-svh max-w-[1600px] flex-col px-5 pb-12 pt-5 md:px-[4.2vw] md:pb-16 md:pt-8">
            <div data-cp-item style={{ ["--i" as string]: 0 }} className="flex items-center justify-between">
              <p className="text-[12px] uppercase tracking-[0.3em] text-[#eef1f8]/60">Contact</p>
              <button
                type="button"
                onClick={close}
                className="group inline-flex min-h-11 items-center gap-3 rounded-full border border-white/20 pl-5 pr-1.5 text-[13px] uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-[#050a1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Close
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 group-hover:rotate-90">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="mt-12 grid flex-1 gap-14 md:mt-16 md:grid-cols-2 md:gap-[4.2vw]">
              <div className="md:sticky md:top-8 md:self-start">
                <h2 id={`${id}-title`} className="whitespace-nowrap text-[10.4vw] font-medium leading-[0.92] tracking-[-0.055em] md:text-[min(4.9vw,10vh)]">
                  {contact.heading.map((line, i) => (
                    <span key={line} className="block overflow-hidden pb-[0.06em]">
                      <span data-cp-line style={{ ["--i" as string]: i }} className={cn("block", i === 1 && "font-light")}>
                        {line}
                      </span>
                    </span>
                  ))}
                </h2>
                <p data-cp-item style={{ ["--i" as string]: 2 }} className="mt-6 max-w-[32ch] text-[clamp(1.2rem,4.6vw,1.5rem)] font-light leading-[1.3] tracking-[-0.02em] text-[#eef1f8]/80 md:mt-8 md:text-[clamp(1.25rem,1.7vw,1.75rem)]">
                  {contact.body}
                </p>
                <p data-cp-item style={{ ["--i" as string]: 3 }} className="mt-8 hidden max-w-[44ch] text-[13px] leading-[1.6] text-[#eef1f8]/50 md:block">
                  <Privacy />
                </p>
              </div>

              <div>
                {sent ? (
                  <Sent email={values.email} onClose={close} />
                ) : (
                  <form ref={form} noValidate onSubmit={submit} aria-describedby={`${id}-status`} className="relative">
                    <fieldset data-cp-item style={{ ["--i" as string]: 2 }} aria-describedby={errors.category ? `${id}-category-error` : undefined}>
                      <legend className="eyebrow !text-[#eef1f8]/55">{contact.categoryLegend}</legend>
                      {preselected && selected && <p className="mt-2 text-[12px] text-[#e9b77f]">Preselected from your earlier choice — change it any time.</p>}
                      <div className="mt-5 border-t border-white/12">
                        {contactCategories.map((c, i) => {
                          const on = category === c.id;
                          return (
                            <label
                              key={c.id}
                              className={cn(
                                "group/cat relative flex cursor-pointer items-start gap-5 overflow-hidden border-b border-white/12 py-5 transition-colors duration-500 md:gap-7 md:py-6",
                                on ? "text-[#050a1c]" : "text-[#eef1f8] hover:text-white",
                              )}
                            >
                              {/* The selection fills in from the left like a light coming on. */}
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute inset-0 origin-left bg-[linear-gradient(90deg,#f4f1eb,#e6e1d8)] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]",
                                  on ? "scale-x-100" : "scale-x-0",
                                )}
                              />
                              <input
                                type="radio"
                                name="category"
                                value={c.id}
                                checked={on}
                                onChange={() => {
                                  setCategory(c.id);
                                  setPreselected(false);
                                  setErrors((prev) => ({ ...prev, category: undefined }));
                                }}
                                className="peer sr-only"
                              />
                              <span className="pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-[#e9b77f]" aria-hidden="true" />
                              <span className={cn("relative pl-1 pt-1 text-[12px] tabular-nums tracking-[0.2em] transition-opacity md:pl-4", on ? "opacity-70" : "opacity-50")}>{pad(i + 1)}</span>
                              <span className="relative flex-1">
                                <span className="block text-[clamp(1.4rem,6vw,1.75rem)] font-light leading-[1.1] tracking-[-0.035em] md:text-[clamp(1.5rem,2.1vw,2.2rem)]">{c.label}</span>
                                <span className={cn("mt-1.5 block text-[13.5px] leading-[1.5] transition-opacity", on ? "opacity-70" : "opacity-55")}>{c.description}</span>
                              </span>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "relative mr-1 mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500 md:mr-4",
                                  on ? "border-[#050a1c] bg-[#050a1c]" : "border-white/30 group-hover/cat:border-white/70",
                                )}
                              >
                                <span className={cn("h-2 w-2 rounded-full bg-[#f4f1eb] transition-transform duration-500", on ? "scale-100" : "scale-0")} />
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.category && (
                        <p id={`${id}-category-error`} className="mt-3 text-[13px] text-[#ffb4a2]">
                          {errors.category}
                        </p>
                      )}
                    </fieldset>

                    {/* The form unfolds once a category is chosen. */}
                    <div className={cn("grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]", selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden" inert={!selected}>
                        <div className={cn("pt-10 transition-[opacity,transform] duration-700", selected ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0")}>
                          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/12 pb-4">
                            <p className="text-[13px] text-[#eef1f8]/60">
                              Inquiry: <span className="text-[#eef1f8]">{selected?.label}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => dialog.current?.querySelector<HTMLInputElement>('input[name="category"]:checked')?.focus()}
                              className="text-[12px] uppercase tracking-[0.18em] text-[#eef1f8]/60 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            >
                              Change
                            </button>
                          </div>

                          <div className="mt-2 grid gap-x-8 md:grid-cols-2">
                            <Field id={id} name="name" label="Full name" autoComplete="name" value={values.name} error={errors.name} max={LIMITS.name.max} onChange={update} onBlur={blur} required />
                            <Field id={id} name="email" label="Email address" type="email" inputMode="email" autoComplete="email" value={values.email} error={errors.email} max={LIMITS.email.max} onChange={update} onBlur={blur} required />
                          </div>
                          <Field id={id} name="company" label="Company name" optional autoComplete="organization" value={values.company} error={errors.company} max={LIMITS.company.max} onChange={update} onBlur={blur} />
                          <Field id={id} name="message" label="Message" multiline value={values.message} error={errors.message} max={LIMITS.message.max} onChange={update} onBlur={blur} required />

                          {/* Spam trap: invisible to people, tempting to bots. */}
                          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                            <label>
                              Website
                              <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
                            </label>
                          </div>

                          {available === false && (
                            <p className="mt-8 rounded-2xl border border-[#e9b77f]/40 bg-[#e9b77f]/[0.08] px-5 py-4 text-[14px] leading-[1.55] text-[#f4dcbd]">{contact.unavailable}</p>
                          )}

                          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <p className="max-w-[40ch] text-[12.5px] leading-[1.6] text-[#eef1f8]/50 md:hidden">
                              <Privacy />
                            </p>
                            <button
                              type="submit"
                              aria-disabled={available === false || status.kind === "sending" || undefined}
                              aria-busy={status.kind === "sending" || undefined}
                              className={cn(
                                "group relative inline-flex h-16 w-fit items-center gap-6 overflow-hidden rounded-full bg-[#f4f1eb] pl-8 pr-2.5 text-[13px] font-medium tracking-[0.18em] text-[#050a1c] transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:ml-auto",
                                available === false && "cursor-not-allowed opacity-40",
                              )}
                            >
                              <span>{status.kind === "sending" ? "SENDING…" : "SEND MESSAGE"}</span>
                              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#050a1c] text-[#f4f1eb] transition-transform duration-500 group-hover:rotate-45">
                                {status.kind === "sending" ? <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" /> : <ArrowUpRight className="h-4 w-4" />}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p id={`${id}-status`} role="status" aria-live="polite" className={cn("mt-6 text-[14px] leading-[1.5]", status.kind === "error" && !(available === false && status.message === contact.unavailable) ? "text-[#ffb4a2]" : "sr-only")}>
                      {status.kind === "error" ? status.message : status.kind === "sending" ? "Sending your message…" : ""}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function Privacy() {
  return (
    <>
      {contact.privacyNote}
      {contact.privacyPolicy && (
        <>
          {" "}
          <a href={contact.privacyPolicy.href} className="underline underline-offset-4 hover:text-white">
            {contact.privacyPolicy.label}
          </a>
          .
        </>
      )}
    </>
  );
}

type FieldProps = {
  id: string;
  name: keyof Values;
  label: string;
  value: string;
  error?: string;
  max: number;
  type?: string;
  inputMode?: "email" | "text";
  autoComplete?: string;
  multiline?: boolean;
  optional?: boolean;
  required?: boolean;
  onChange: (field: keyof Values, value: string) => void;
  onBlur: (field: keyof Values) => void;
};

function Field({ id, name, label, value, error, max, type = "text", inputMode, autoComplete, multiline, optional, required, onChange, onBlur }: FieldProps) {
  const fieldId = `${id}-${name}`;
  const errorId = `${fieldId}-error`;
  const common = {
    id: fieldId,
    name,
    value,
    maxLength: max,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onBlur: () => onBlur(name),
    placeholder: " ",
    className:
      "peer block w-full resize-none border-0 border-b bg-transparent px-0 pb-3 pt-7 text-[17px] leading-[1.5] text-[#eef1f8] outline-none transition-colors placeholder:text-transparent focus:border-[#e9b77f] " +
      (error ? "border-[#ffb4a2]" : "border-white/20 hover:border-white/40"),
  };
  return (
    <div className="relative mt-6">
      {multiline ? (
        <textarea {...common} rows={5} onChange={(e) => onChange(name, e.target.value)} />
      ) : (
        <input {...common} type={type} inputMode={inputMode} autoComplete={autoComplete} onChange={(e) => onChange(name, e.target.value)} />
      )}
      <label
        htmlFor={fieldId}
        className="pointer-events-none absolute left-0 top-7 origin-left text-[17px] text-[#eef1f8]/55 transition-all duration-300 peer-focus:top-0 peer-focus:text-[12px] peer-focus:tracking-[0.12em] peer-focus:text-[#e9b77f] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[12px] peer-[:not(:placeholder-shown)]:tracking-[0.12em]"
      >
        {label}
        {optional && <span className="ml-2 opacity-60">(optional)</span>}
      </label>
      {/* A thin light runs along the underline on focus. */}
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-[#e9b77f] transition-transform duration-500 peer-focus:scale-x-100" />
      <div className="mt-2 flex justify-between gap-4 text-[12.5px]">
        <span id={errorId} className="text-[#ffb4a2]">
          {error}
        </span>
        {multiline && <span className="tabular-nums text-[#eef1f8]/40">{value.length} / {max}</span>}
      </div>
    </div>
  );
}

function Sent({ email, onClose }: { email: string; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className="flex min-h-[50vh] flex-col justify-center" role="status">
      <span aria-hidden="true" className="mb-8 h-px w-24 bg-[#e9b77f]" />
      <h3 ref={heading} tabIndex={-1} className="text-[clamp(2rem,8vw,3.6rem)] font-light leading-[1] tracking-[-0.045em] outline-none">
        Thank you. Your message has been sent.
      </h3>
      <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.6] text-[#eef1f8]/70">
        Your inquiry has been passed on to the FASFAR team. Any reply will go to <span className="text-[#eef1f8]">{email}</span>.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-10 inline-flex h-14 w-fit items-center gap-4 rounded-full border border-white/25 px-7 text-[13px] uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-[#050a1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Back to FASFAR
      </button>
    </div>
  );
}
