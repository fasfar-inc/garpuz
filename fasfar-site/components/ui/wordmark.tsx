import { cn } from "@/lib/cn";

/** The FASFAR letterforms use crossbar-less A's (Λ). */
const LETTERS = ["F", "Λ", "S", "F", "Λ", "R"];

type Props = {
  className?: string;
  /** Wrap each letter in a mask so it can rise in on entrance. */
  masked?: boolean;
  letterClassName?: string;
};

export function Wordmark({ className, masked, letterClassName }: Props) {
  return (
    <span className={cn("inline-flex select-none whitespace-nowrap", className)} aria-hidden="true">
      {LETTERS.map((letter, i) =>
        masked ? (
          <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
            <span data-letter className={cn("inline-block will-change-transform", letterClassName)}>
              {letter}
            </span>
          </span>
        ) : (
          <span key={i} className={letterClassName}>
            {letter}
          </span>
        ),
      )}
    </span>
  );
}
