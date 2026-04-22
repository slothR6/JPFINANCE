"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { Bill, Expense, Income } from "@/types";
import { parseISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface Props {
  year: number;
  month: number; // 0-indexed
  incomes: Income[];
  expenses: Expense[];
  bills: Bill[];
  onDayClick?: (date: Date, events: DayEvents) => void;
}

export interface DayEvents {
  incomes: Income[];
  expenses: Expense[];
  bills: Bill[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function FinCalendar({ year, month, incomes, expenses, bills, onDayClick }: Props) {
  const monthDate = new Date(year, month, 1);
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const firstDayOfWeek = getDay(days[0]); // 0=Sun

  const eventMap = useMemo(() => {
    const map = new Map<string, DayEvents>();

    const key = (d: Date) => format(d, "yyyy-MM-dd");

    for (const inc of incomes) {
      const k = inc.receivedAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.incomes.push(inc);
    }
    for (const exp of expenses) {
      const k = exp.paidAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.expenses.push(exp);
    }
    for (const bill of bills) {
      if (bill.status === "paid") continue;
      const k = bill.dueAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.bills.push(bill);
    }

    return map;
  }, [incomes, expenses, bills]);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-2xs font-medium uppercase tracking-wide text-fg-subtle">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl bg-hairline overflow-hidden">
        {/* Empty cells for first week */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 bg-surface-2/30 sm:h-16" />
        ))}

        {days.map((day) => {
          const k = format(day, "yyyy-MM-dd");
          const events = eventMap.get(k);
          const hasIncome = (events?.incomes.length ?? 0) > 0;
          const hasExpense = (events?.expenses.length ?? 0) > 0;
          const hasBill = (events?.bills.length ?? 0) > 0;
          const today = isToday(day);

          return (
            <button
              key={k}
              type="button"
              onClick={() => events && onDayClick?.(day, events)}
              className={cn(
                "relative flex h-14 flex-col items-center bg-surface px-1 pb-1 pt-1.5 transition sm:h-16",
                (hasIncome || hasExpense || hasBill) && "cursor-pointer hover:bg-surface-2",
                !(hasIncome || hasExpense || hasBill) && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  today && "bg-fg text-bg",
                  !today && "text-fg",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Event dots */}
              <div className="mt-auto flex gap-0.5">
                {hasIncome && (
                  <span className="h-1.5 w-1.5 rounded-full bg-success" title="Receita" />
                )}
                {hasExpense && (
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" title="Despesa" />
                )}
                {hasBill && (
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" title="Conta a pagar" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-2xs text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" /> Receita
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" /> Despesa / Gasto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Conta pendente
        </span>
      </div>
    </div>
  );
}
