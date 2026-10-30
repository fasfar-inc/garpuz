import { forwardRef } from "react";
import { SHAPES, isShapeId } from "@/lib/shapes/registry";

interface Props {
  shape: string;
  mode: "openai" | "demo" | null;
}

export const Header = forwardRef<HTMLElement, Props>(function Header({ shape, mode }, ref) {
  const form = isShapeId(shape) && shape !== "self" ? SHAPES[shape].label : null;
  return (
    <header
      ref={ref}
      className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-4 pt-[max(env(safe-area-inset-top),1.1rem)] pb-2"
    >
      <h1 className="pl-[0.55em] text-[11px] font-medium uppercase tracking-[0.55em] text-white/70">Jasayit</h1>
      <p className="h-4 text-[10px] uppercase tracking-[0.3em] text-white/30 transition-opacity duration-700">
        {form ? `currently a ${form}` : "particle organism"}
      </p>
      {mode === "demo" && (
        <span
          className="absolute right-4 top-[max(env(safe-area-inset-top),1.1rem)] text-[9px] uppercase tracking-[0.3em] text-white/25"
          title="No OpenAI key configured: replies come from the built-in demo brain."
        >
          demo
        </span>
      )}
    </header>
  );
});
