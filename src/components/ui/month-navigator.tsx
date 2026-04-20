"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

export function MonthNavigator({
  currentMonth,
  onPrevious,
  onNext,
}: {
  currentMonth: Date;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <Button variant="ghost" className="h-10 w-10 rounded-xl p-0" onClick={onPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[170px] px-3 text-center text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
        {formatMonthLabel(currentMonth)}
      </div>
      <Button variant="ghost" className="h-10 w-10 rounded-xl p-0" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
