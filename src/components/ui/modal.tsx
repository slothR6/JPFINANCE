"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  tone?: "default" | "danger";
}

export function Modal({ open, onClose, title, description, children, footer, tone = "default" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-pop animate-fade-in">
        <h2 className={cn("text-base font-semibold", tone === "danger" ? "text-danger" : "text-fg")}>
          {title}
        </h2>
        {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
