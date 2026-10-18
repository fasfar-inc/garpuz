"use client";

import type { ReactNode } from "react";

export function WhatsAppLink({ offerId, href, className, children }: { offerId: string; href: string; className: string; children: ReactNode }) {
  function track() {
    void fetch("/api/analytics/whatsapp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ offerId }), keepalive: true });
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className={className}>{children}</a>;
}
