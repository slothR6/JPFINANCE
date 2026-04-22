"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-fg text-bg hover:bg-fg/90 disabled:bg-fg/40 disabled:text-bg/60 focus-visible:ring-fg/20",
  secondary:
    "bg-surface-2 text-fg hover:bg-border border border-hairline focus-visible:ring-fg/10",
  outline:
    "border border-hairline bg-transparent text-fg hover:bg-surface-2 focus-visible:ring-fg/10",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:ring-fg/10",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading, iconLeft, iconRight, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});
