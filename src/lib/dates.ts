import {
  addDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
} from "date-fns";

export function nowIso() {
  return new Date().toISOString();
}

export function getMonthKey(date: string | Date) {
  return format(typeof date === "string" ? parseISO(`${date}T00:00:00`) : date, "yyyy-MM");
}

export function getMonthDate(monthKey: string) {
  return parseISO(`${monthKey}-01T00:00:00`);
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date());
}

export function buildDateInMonth(monthKey: string, sourceDate: string) {
  const base = getMonthDate(monthKey);
  const source = parseISO(`${sourceDate}T00:00:00`);
  const day = Math.min(source.getDate(), endOfMonth(base).getDate());

  return format(new Date(base.getFullYear(), base.getMonth(), day), "yyyy-MM-dd");
}

export function monthInterval(monthKey: string) {
  const currentMonth = getMonthDate(monthKey);

  return {
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  };
}

export function isDateInMonth(date: string, monthKey: string) {
  const normalizedDate = parseISO(`${date}T00:00:00`);
  const interval = monthInterval(monthKey);

  return isWithinInterval(normalizedDate, interval);
}

export function isTodayDate(date: string) {
  return isSameDay(parseISO(`${date}T00:00:00`), new Date());
}

export function isDateWithinNextDays(date: string, days: number) {
  const value = parseISO(`${date}T00:00:00`);
  const start = new Date();
  const end = addDays(start, days);

  return isWithinInterval(value, {
    start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    end: new Date(end.getFullYear(), end.getMonth(), end.getDate()),
  });
}

export function isPastDate(date: string) {
  const value = parseISO(`${date}T00:00:00`);
  const today = new Date();

  return isBefore(value, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
}

export function isFutureDate(date: string) {
  const value = parseISO(`${date}T00:00:00`);
  const today = new Date();

  return isAfter(value, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
}
