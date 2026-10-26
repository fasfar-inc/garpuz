import { cn } from "@/lib/cn";

/**
 * Thin architectural lines. Positions are percentages of the parent; the
 * parent's timeline draws them (scaleX / scaleY from 0) via `data-line`.
 */
export function HLine({ top, className }: { top: string; className?: string }) {
  return <span data-line="h" aria-hidden="true" className={cn("absolute inset-x-0 h-px origin-left bg-[#141312]/15", className)} style={{ top }} />;
}

export function VLine({ left, top = "0%", className }: { left: string; top?: string; className?: string }) {
  return <span data-line="v" aria-hidden="true" className={cn("absolute bottom-0 w-px origin-top bg-[#141312]/12", className)} style={{ left, top }} />;
}

/** A small crosshair where two lines meet: the "drafting table" detail. */
export function Mark({ top, left }: { top: string; left: string }) {
  return (
    <span data-mark aria-hidden="true" className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2" style={{ top, left }}>
      <span className="absolute left-1/2 top-0 h-full w-px bg-[#141312]/45" />
      <span className="absolute left-0 top-1/2 h-px w-full bg-[#141312]/45" />
    </span>
  );
}

/** Characters, each in its own mask, for letter-by-letter reveals. */
export function MaskedChars({ text, charAttr, className }: { text: string; charAttr: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex", className)}>
      {[...text].map((ch, i) => (
        // A little horizontal room so tight tracking doesn't clip a letter's edge.
        <span key={i} className="-mx-[0.04em] inline-block overflow-hidden px-[0.04em] pb-[0.06em] align-top">
          <span {...{ [charAttr]: "" }} className="inline-block whitespace-pre">
            {ch}
          </span>
        </span>
      ))}
    </span>
  );
}
