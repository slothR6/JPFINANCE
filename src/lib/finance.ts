import type { Bill, Debt, Expense, Income } from "@/types";
import { isInMonth, type MonthRef } from "@/lib/dates";

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

export function incomesForMonth(items: Income[], m: MonthRef) {
  return items.filter((i) => isInMonth(i.receivedAt, m));
}

export function expensesForMonth(items: Expense[], m: MonthRef) {
  return items.filter((e) => isInMonth(e.paidAt, m));
}

export function billsForMonth(items: Bill[], m: MonthRef) {
  return items.filter((b) => isInMonth(b.dueAt, m));
}

export function debtRemaining(d: Debt): number {
  if (d.debtKind === "mapeada" || d.installments == null || d.installmentAmount == null) {
    return d.totalAmount;
  }
  return Math.max(0, d.totalAmount - (d.paidInstallments ?? 0) * d.installmentAmount);
}

export function debtProgress(d: Debt): number {
  if (d.debtKind === "mapeada" || !d.installments || d.installments <= 0) return 0;
  return Math.min(1, (d.paidInstallments ?? 0) / d.installments);
}

export function groupBy<T, K extends string | number>(items: T[], key: (t: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function aggregateByCategory<T extends { categoryId: string; amount: number }>(items: T[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.categoryId, (map.get(it.categoryId) ?? 0) + it.amount);
  }
  return Array.from(map.entries()).map(([categoryId, total]) => ({ categoryId, total }));
}
