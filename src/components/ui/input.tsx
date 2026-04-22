"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle transition " +
  "focus:border-fg/30 focus:outline-none focus:ring-2 focus:ring-fg/10 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-muted";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} {...props} className={cn(baseField, className)} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} {...props} className={cn(baseField, "resize-none", className)} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} {...props} className={cn(baseField, "pr-9 appearance-none bg-no-repeat bg-[right_0.75rem_center]", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
      }}>
      {children}
    </select>
  );
});
