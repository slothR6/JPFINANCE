"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const remove = (id: number) => setItems((s) => s.filter((t) => t.id !== id));

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = nextId++;
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => remove(id), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border border-hairline bg-surface p-3.5 shadow-pop animate-fade-in",
            )}
          >
            <div className={cn("mt-0.5 shrink-0", iconTone[t.tone])}>{iconFor(t.tone)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-fg">{t.title}</div>
              {t.description && <div className="mt-0.5 text-xs text-fg-muted">{t.description}</div>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 text-fg-subtle transition hover:text-fg"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const iconTone: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-info",
};

function iconFor(tone: ToastTone) {
  if (tone === "success") return <CheckCircle2 size={18} />;
  if (tone === "error") return <AlertTriangle size={18} />;
  return <Info size={18} />;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
