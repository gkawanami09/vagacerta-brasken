import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "bg-[#75182C] text-white hover:opacity-90 focus:ring-[#75182C]",
      outline: "border border-current bg-transparent text-current hover:bg-black/5 focus:ring-current",
      ghost: "bg-transparent text-current hover:bg-black/5 focus:ring-current",
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
