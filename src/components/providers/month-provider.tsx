"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { currentMonth, nextMonth, prevMonth, type MonthRef } from "@/lib/dates";

interface MonthContextValue {
  month: MonthRef;
  setMonth: (m: MonthRef) => void;
  goNext: () => void;
  goPrev: () => void;
  goToday: () => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonth] = useState<MonthRef>(() => currentMonth());
  const value = useMemo<MonthContextValue>(
    () => ({
      month,
      setMonth,
      goNext: () => setMonth((m) => nextMonth(m)),
      goPrev: () => setMonth((m) => prevMonth(m)),
      goToday: () => setMonth(currentMonth()),
    }),
    [month],
  );
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
