import { createHmac } from "node:crypto";
import { contactCategories } from "@/content/finale";
import type { ContactInput } from "./schema";

/**
 * Where accepted inquiries go. Server-only: read from environment variables
 * that are never exposed to the browser (no NEXT_PUBLIC_ prefix).
 *
 * Providers, chosen by CONTACT_PROVIDER or by which variables are set:
 *  - "resend":  RESEND_API_KEY, CONTACT_TO_EMAIL (comma-separated), CONTACT_FROM_EMAIL
 *  - "webhook": CONTACT_WEBHOOK_URL, optional CONTACT_WEBHOOK_SECRET (HMAC-SHA256 signature)
 *
 * With nothing configured there is no provider, and the API says so instead
 * of pretending to send.
 */
export type ContactMessage = ContactInput & { receivedAt: string };
type Provider = { name: string; send: (message: ContactMessage) => Promise<void> };

const TIMEOUT_MS = 10_000;
const env = (key: string) => process.env[key]?.trim() || undefined;
const categoryLabel = (id: string) => contactCategories.find((c) => c.id === id)?.label ?? id;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function render(m: ContactMessage) {
  const rows: [string, string][] = [
    ["Category", categoryLabel(m.category)],
    ["Name", m.name],
    ["Email", m.email],
    ...(m.company ? ([["Company", m.company]] as [string, string][]) : []),
    ["Received", m.receivedAt],
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${m.message}`;
  const html = `<table cellpadding="4" style="font:14px/1.5 system-ui,sans-serif;color:#141312">${rows
    .map(([k, v]) => `<tr><td style="color:#6b625a">${k}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table><p style="font:15px/1.6 system-ui,sans-serif;color:#141312;white-space:pre-wrap">${escapeHtml(m.message)}</p>`;
  return { subject: `[FASFAR] ${categoryLabel(m.category)} — ${m.name}`, text, html };
}

function resend(): Provider | null {
  const key = env("RESEND_API_KEY");
  const to = env("CONTACT_TO_EMAIL")?.split(",").map((s) => s.trim()).filter(Boolean);
  const from = env("CONTACT_FROM_EMAIL");
  if (!key || !to?.length || !from) return null;
  return {
    name: "resend",
    async send(m) {
      const { subject, text, html } = render(m);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, reply_to: m.email, subject, text, html }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    },
  };
}

function webhook(): Provider | null {
  const url = env("CONTACT_WEBHOOK_URL");
  if (!url) return null;
  const secret = env("CONTACT_WEBHOOK_SECRET");
  return {
    name: "webhook",
    async send(m) {
      const body = JSON.stringify({ type: "contact.inquiry", categoryLabel: categoryLabel(m.category), ...m });
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (secret) headers["X-FASFAR-Signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    },
  };
}

export function getContactProvider(): Provider | null {
  switch (env("CONTACT_PROVIDER")) {
    case "resend":
      return resend();
    case "webhook":
      return webhook();
    default:
      return resend() ?? webhook();
  }
}
