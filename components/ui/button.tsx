import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" }) {
  return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A] disabled:pointer-events-none disabled:opacity-50", variant === "primary" && "bg-[#07834A] text-white hover:bg-[#056B3D]", variant === "outline" && "border border-[#D9E1DC] bg-white text-[#17211B] hover:border-[#07834A] hover:text-[#07834A]", variant === "ghost" && "text-[#4D5C53] hover:bg-[#F1F5F2]", className)} {...props} />;
}
