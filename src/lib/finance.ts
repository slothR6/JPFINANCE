import type { Bill, CreditCard, Debt, Expense, ExpensePaymentStatus, Income } from "@/types";
import { addMonths, endOfMonth } from "date-fns";
import {
  format,
  getCreditCardDueDate,
  isInMonth,
  monthToDate,
  parseISO,
  type MonthRef,
} from "@/lib/dates";

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

export function incomesForMonth(items: Income[], m: MonthRef) {
  return items.flatMap((income) => {
    if (!income.recurring) return isInMonth(income.receivedAt, m) ? [income] : [];
    const occurrence = incomeOccurrenceForMonth(income, m);
    return occurrence ? [occurrence] : [];
  });
}

export function expensesForMonth(items: Expense[], m: MonthRef) {
  return expensesForDateMonth(items, m, (expense) => expense.paidAt);
}

export function expensesForCompetenceMonth(items: Expense[], creditCards: CreditCard[], m: MonthRef) {
  const cardMap = new Map(creditCards.map((card) => [card.id, card]));
  return expensesForDateMonth(items, m, (expense) => {
    const card = expense.creditCardId ? cardMap.get(expense.creditCardId) : undefined;
    return getExpenseCompetenceDate(expense, card);
  });
}

export function expensesForDateMonth(
  items: Expense[],
  m: MonthRef,
  dateForExpense: (expense: Expense) => string,
) {
  const materializedRecurringKeys = new Set(
    items
      .filter((expense) => expense.recurringOccurrence && expense.recurringBaseId)
      .map((expense) => recurringOccurrenceKey(expense.recurringBaseId!, expense.paidAt)),
  );

  return items.flatMap((expense) => {
    if (expense.recurringOccurrence && expense.recurringBaseId) {
      return isInMonth(dateForExpense(expense), m) ? [expense] : [];
    }

    const candidates = expense.recurring
      ? recurringExpenseCandidatesForDateMonth(expense, m)
      : [expense];

    return candidates.filter((candidate) => {
      if (candidate.recurringOccurrence) {
        const baseId = candidate.recurringBaseId ?? expense.id;
        if (materializedRecurringKeys.has(recurringOccurrenceKey(baseId, candidate.paidAt))) {
          return false;
        }
      }
      return isInMonth(dateForExpense(candidate), m);
    });
  });
}

export function expensesForPayableMonth(
  items: Expense[],
  creditCards: CreditCard[],
  m: MonthRef,
) {
  return expensesForCompetenceMonth(items, creditCards, m).filter(
    (expense) => !expense.expenseKind || expense.expenseKind === "despesa",
  );
}

export function pendingExpensesForPayableMonth(
  items: Expense[],
  creditCards: CreditCard[],
  m: MonthRef,
) {
  return expensesForPayableMonth(items, creditCards, m).filter((expense) => !isExpensePaid(expense));
}

export function recurringExpensesForPayableMonth(
  items: Expense[],
  creditCards: CreditCard[],
  m: MonthRef,
) {
  return expensesForPayableMonth(items, creditCards, m).filter(
    (expense) => expense.recurring || expense.recurringOccurrence,
  );
}

export function expensePaymentStatus(expense: Expense): ExpensePaymentStatus {
  if (expense.paymentStatus) return expense.paymentStatus;
  return expense.expenseKind === "gasto" ? "paid" : "pending";
}

export function isExpensePaid(expense: Expense): boolean {
  return expensePaymentStatus(expense) === "paid";
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

export function getExpenseCreditCardDueAt(expense: Expense, creditCard?: CreditCard): string | undefined {
  if (expense.creditCardDueAt) return expense.creditCardDueAt;
  if (expense.method !== "cartao" || !creditCard) return undefined;
  return getCreditCardDueDate(expense.paidAt, creditCard.closingDay, creditCard.dueDay);
}

export function getExpenseCompetenceDate(expense: Expense, creditCard?: CreditCard): string {
  if (expense.method !== "cartao") return expense.paidAt;
  return getExpenseCreditCardDueAt(expense, creditCard) ?? expense.paidAt;
}

function incomeOccurrenceForMonth(income: Income, m: MonthRef): Income | null {
  const receivedAt = recurringDateForMonth(income.receivedAt, m);
  if (!receivedAt) return null;
  if (receivedAt === income.receivedAt) return income;

  return {
    ...income,
    id: recurringOccurrenceId(income.id, m),
    receivedAt,
    recurringBaseId: income.recurringBaseId ?? income.id,
    recurringOccurrence: true,
  };
}

function expenseOccurrenceForMonth(expense: Expense, m: MonthRef): Expense | null {
  const paidAt = recurringDateForMonth(expense.paidAt, m);
  if (!paidAt) return null;
  if (paidAt === expense.paidAt) return expense;

  return {
    ...expense,
    id: recurringOccurrenceId(expense.id, m),
    paidAt,
    paymentStatus: "pending",
    paidOn: undefined,
    creditCardDueAt: undefined,
    recurringBaseId: expense.recurringBaseId ?? expense.id,
    recurringOccurrence: true,
  };
}

function recurringExpenseCandidatesForDateMonth(expense: Expense, m: MonthRef): Expense[] {
  const monthCandidates = [m, addMonthsToRef(m, -1), addMonthsToRef(m, -2)];
  const seen = new Set<string>();
  const expenses: Expense[] = [];

  for (const month of monthCandidates) {
    const occurrence = expenseOccurrenceForMonth(expense, month);
    if (!occurrence || seen.has(occurrence.id)) continue;
    seen.add(occurrence.id);
    expenses.push(occurrence);
  }

  return expenses;
}

function recurringDateForMonth(baseIso: string, m: MonthRef): string | null {
  try {
    const baseDate = parseISO(baseIso);
    const baseMonth = { year: baseDate.getFullYear(), month: baseDate.getMonth() };
    if (compareMonthRefs(m, baseMonth) < 0) return null;

    const lastDay = endOfMonth(monthToDate(m)).getDate();
    const day = Math.min(baseDate.getDate(), lastDay);
    return format(new Date(m.year, m.month, day), "yyyy-MM-dd");
  } catch {
    return null;
  }
}

function addMonthsToRef(m: MonthRef, amount: number): MonthRef {
  const date = addMonths(monthToDate(m), amount);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function compareMonthRefs(a: MonthRef, b: MonthRef): number {
  return a.year === b.year ? a.month - b.month : a.year - b.year;
}

function recurringOccurrenceId(baseId: string, m: MonthRef) {
  return `${baseId}:recurring:${m.year}-${String(m.month + 1).padStart(2, "0")}`;
}

function recurringOccurrenceKey(baseId: string, iso: string) {
  try {
    const date = parseISO(iso);
    return `${baseId}:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  } catch {
    return `${baseId}:${iso.slice(0, 7)}`;
  }
}
