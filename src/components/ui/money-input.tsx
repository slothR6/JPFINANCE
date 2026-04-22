"use client";

import { forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

function formatCents(cents: number): string {
  const v = cents / 100;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { value, onChange, placeholder = "0,00", className, disabled, autoFocus, id },
  ref,
) {
  const [raw, setRaw] = useState<string>(() => formatCents(Math.round((value || 0) * 100)));

  useEffect(() => {
    setRaw(formatCents(Math.round((value || 0) * 100)));
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits === "" ? 0 : parseInt(digits, 10);
    setRaw(formatCents(cents));
    onChange(cents / 100);
  };

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">
        R$
      </span>
      <input
        id={id}
        ref={ref}
        autoFocus={autoFocus}
        inputMode="numeric"
        disabled={disabled}
        value={raw}
        onChange={handle}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-hairline bg-surface py-2.5 pl-10 pr-3.5 text-sm text-fg placeholder:text-fg-subtle",
          "focus:border-fg/30 focus:outline-none focus:ring-2 focus:ring-fg/10",
          "tabular-nums font-medium",
        )}
      />
    </div>
  );
});
