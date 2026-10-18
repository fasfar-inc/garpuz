import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-11 w-full rounded-xl border border-[#D9E1DC] bg-white px-3 text-[15px] text-[#17211B] outline-none transition placeholder:text-[#849087] focus:border-[#07834A] focus:ring-3 focus:ring-[#07834A]/10", className)} {...props} />
));
Input.displayName = "Input";
