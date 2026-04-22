"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const widths = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-xl",
};

export function Drawer({ open, onClose, title, description, children, footer, size = "md" }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-pop",
          "animate-slide-in-right",
          widths[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-surface-2/50 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
