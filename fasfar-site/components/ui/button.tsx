import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "light";

const variants: Record<Variant, string> = {
  solid: "bg-(--ink) text-(--paper) hover:opacity-90",
  outline: "border border-(--hairline-strong) text-(--ink) hover:bg-(--ink) hover:text-(--paper)",
  light: "bg-[#f4f2ee] text-[#111] hover:bg-white",
};

type Props = { href: string; variant?: Variant; children: ReactNode; className?: string; icon?: ReactNode };

/** Pill call-to-action. In-page hashes are intercepted by the stage for smooth scene jumps. */
export function PillLink({ href, variant = "solid", children, className, icon }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center gap-4 rounded-full px-7 text-[15px] tracking-[-0.01em] transition-[background-color,color,opacity] duration-300 md:h-[50px] md:px-8",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ink)",
        variants[variant],
        className,
      )}
    >
      {children}
      {icon && <span className="transition-transform duration-300 group-hover:translate-x-1">{icon}</span>}
    </Link>
  );
}
