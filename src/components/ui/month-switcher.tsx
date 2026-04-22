"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonth } from "@/components/providers/month-provider";
import { formatMonthLong } from "@/lib/dates";

export function MonthSwitcher() {
  const { month, goPrev, goNext, goToday } = useMonth();
  const label = formatMonthLong(month);
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface p-1 shadow-xs">
      <button
        onClick={goPrev}
        className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={goToday}
        className="min-w-[140px] px-2 text-center text-xs font-medium capitalize text-fg"
      >
        {label}
      </button>
      <button
        onClick={goNext}
        className="flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
