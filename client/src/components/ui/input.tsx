import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    const base =
      "block w-full rounded-md border border-[#E6E2D9] bg-white px-3 py-2 text-sm text-[#1C1C1C] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#75182C] focus:border-[#75182C] disabled:cursor-not-allowed disabled:opacity-60";
    return <input ref={ref} className={`${base} ${className}`} {...props} />;
  }
);

Input.displayName = "Input";
