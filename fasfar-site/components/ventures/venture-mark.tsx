import type { ReactNode } from "react";

/**
 * Simple placeholder marks drawn from the mockups. Replace an entry with the
 * venture's official logo when it is available; unknown slugs fall back to a
 * monogram, so new ventures render without code changes.
 */
const marks: Record<string, ReactNode> = {
  gardas: (
    <>
      <rect x="2" y="2" width="36" height="36" rx="9" fill="#f5f5f5" />
      <path d="M27.5 14.5a9.5 9.5 0 1 0 1.2 7.2V20.5h-8.2" fill="none" stroke="#151515" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  garpuz: (
    <>
      <defs>
        <linearGradient id="mark-garpuz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb07a" />
          <stop offset="1" stopColor="#e9612c" />
        </linearGradient>
      </defs>
      <path d="M4 36V20C4 11.2 11.2 4 20 4h16v16c0 8.8-7.2 16-16 16H4Z" fill="url(#mark-garpuz)" />
      <path d="M11 30c2-8.5 8-14.2 17.5-17" fill="none" stroke="#fff3ea" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  menuflex: (
    <>
      <defs>
        <linearGradient id="mark-menuflex" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc07e" />
          <stop offset="1" stopColor="#ee7a33" />
        </linearGradient>
      </defs>
      <rect x="3" y="4" width="9" height="32" rx="4.5" fill="url(#mark-menuflex)" />
      <rect x="15.5" y="4" width="9" height="32" rx="4.5" fill="url(#mark-menuflex)" />
      <rect x="28" y="4" width="9" height="32" rx="4.5" fill="url(#mark-menuflex)" />
    </>
  ),
  ffmate: (
    <>
      <defs>
        <linearGradient id="mark-ffmate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8db0ff" />
          <stop offset="1" stopColor="#3f6df5" />
        </linearGradient>
      </defs>
      <path d="M6 12a8 8 0 0 1 8-8h22v8H16v6h16v8H16v10H6V12Z" fill="url(#mark-ffmate)" />
    </>
  ),
};

export function VentureMark({ slug, name, accent, className }: { slug: string; name: string; accent: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {marks[slug] ?? (
        <>
          <rect x="2" y="2" width="36" height="36" rx="10" fill={accent} />
          <text x="20" y="26.5" textAnchor="middle" fontSize="17" fontWeight="600" fill="#111">
            {name.charAt(0)}
          </text>
        </>
      )}
    </svg>
  );
}
