import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export type MonthRef = { year: number; month: number }; // month: 0-11

export function currentMonth(): MonthRef {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthToDate(m: MonthRef): Date {
  return new Date(m.year, m.month, 1);
}

export function nextMonth(m: MonthRef): MonthRef {
  const d = addMonths(monthToDate(m), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function prevMonth(m: MonthRef): MonthRef {
  const d = subMonths(monthToDate(m), 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthRange(m: MonthRef) {
  const d = monthToDate(m);
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

export function formatMonthLong(m: MonthRef) {
  return format(monthToDate(m), "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatMonthShort(m: MonthRef) {
  return format(monthToDate(m), "MMM/yy", { locale: ptBR });
}

export function formatDateBr(iso?: string) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatDateShort(iso?: string) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatDateReadable(iso?: string) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatInvoiceMonth(iso?: string) {
  if (!iso) return "—";
  try {
    const label = format(parseISO(iso), "MMM/yyyy", { locale: ptBR }).replace(".", "");
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return iso;
  }
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function isInMonth(iso: string, m: MonthRef): boolean {
  try {
    return isSameMonth(parseISO(iso), monthToDate(m));
  } catch {
    return false;
  }
}

export function daysUntil(iso: string): number {
  const target = parseISO(iso);
  const now = new Date();
  const diff = Math.floor(
    (target.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return diff;
}

export function isOverdue(iso: string): boolean {
  return isBefore(parseISO(iso), new Date()) && !isSameDay(parseISO(iso), new Date());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getCreditCardDueDate(
  purchaseDateIso: string,
  closingDay: number,
  dueDay: number,
): string {
  const date = parseISO(purchaseDateIso);
  const purchaseDay = date.getDate();
  // If purchased before/on closing day → billed this month's statement → due next month
  // If purchased after closing day → billed next month's statement → due in 2 months
  const monthsAhead = purchaseDay <= closingDay ? 1 : 2;
  const dueDate = addMonths(new Date(date.getFullYear(), date.getMonth(), dueDay), monthsAhead);
  return format(dueDate, "yyyy-MM-dd");
}

export { isAfter, isBefore, parseISO, startOfMonth, endOfMonth, format };
