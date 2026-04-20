import {
  addMonths,
  compareAsc,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { getMonthDate, getMonthKey, isPastDate } from "@/lib/dates";
import type {
  CategoryChartItem,
  Debt,
  DebtPayment,
  EvolutionChartItem,
  Expense,
  ExpenseDisplayStatus,
  FinancialHealth,
  Income,
  MonthlySummary,
  PaymentTimelineItem,
} from "@/types";

export function getExpenseDisplayStatus(
  expense: Pick<Expense, "dueDate" | "status">,
): ExpenseDisplayStatus {
  if (expense.status === "pago") {
    return "pago";
  }

  if (isPastDate(expense.dueDate)) {
    return "atrasado";
  }

  return "pendente";
}

export function getMonthlySummary(params: {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  monthlyBudget: number;
  alertThreshold: number;
}): MonthlySummary {
  const totalIncome = params.incomes.reduce((acc, item) => acc + item.amount, 0);
  const totalExpenses = params.expenses.reduce((acc, item) => acc + item.amount, 0);
  const paidExpenses = params.expenses
    .filter((item) => item.status === "pago")
    .reduce((acc, item) => acc + item.amount, 0);
  const overdueExpenses = params.expenses
    .filter((item) => getExpenseDisplayStatus(item) === "atrasado")
    .reduce((acc, item) => acc + item.amount, 0);
  const pendingExpenses = totalExpenses - paidExpenses;
  const projectedBalance = totalIncome - totalExpenses;
  const debtBalance = params.debts.reduce((acc, item) => acc + item.currentAmount, 0);
  const paidDebtAmount = params.debtPayments.reduce((acc, item) => acc + item.amount, 0);
  const budgetReference = params.monthlyBudget > 0 ? params.monthlyBudget : totalIncome;
  const usagePercentage = budgetReference > 0 ? (totalExpenses / budgetReference) * 100 : 0;

  let health: FinancialHealth = "saudavel";

  if (projectedBalance < 0 || usagePercentage >= 100) {
    health = "estourado";
  } else if (usagePercentage >= params.alertThreshold) {
    health = "atencao";
  }

  return {
    totalIncome,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    overdueExpenses,
    projectedBalance,
    debtBalance,
    paidDebtAmount,
    health,
  };
}

export function getUpcomingExpenses(expenses: Expense[]) {
  const today = startOfDay(new Date());
  const weekAhead = addMonths(today, 0);
  weekAhead.setDate(today.getDate() + 7);

  return {
    today: expenses
      .filter((expense) => expense.dueDate === getMonthDayKey(today))
      .sort((a, b) => compareAsc(new Date(a.dueDate), new Date(b.dueDate))),
    week: expenses.filter((expense) => {
      const value = new Date(`${expense.dueDate}T00:00:00`);

      return (
        expense.status !== "pago" &&
        isWithinInterval(value, {
          start: today,
          end: weekAhead,
        })
      );
    }),
  };
}

function getMonthDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function getRecentPayments(expenses: Expense[], debtPayments: DebtPayment[]): PaymentTimelineItem[] {
  const expensePayments: PaymentTimelineItem[] = expenses
    .filter((expense) => expense.paidAt)
    .map((expense) => ({
      id: `expense-${expense.id}`,
      type: "despesa",
      description: expense.description,
      amount: expense.amount,
      date: expense.paidAt as string,
    }));

  const debtTimeline: PaymentTimelineItem[] = debtPayments.map((payment) => ({
    id: `debt-${payment.id}`,
    type: "divida",
    description: payment.debtName,
    amount: payment.amount,
    date: payment.paymentDate,
  }));

  return [...expensePayments, ...debtTimeline]
    .sort((a, b) => compareAsc(new Date(`${b.date}T00:00:00`), new Date(`${a.date}T00:00:00`)))
    .slice(0, 8);
}

export function groupExpensesByCategory(expenses: Expense[]): CategoryChartItem[] {
  const accumulator = new Map<string, number>();

  expenses.forEach((expense) => {
    accumulator.set(expense.category, (accumulator.get(expense.category) || 0) + expense.amount);
  });

  return Array.from(accumulator.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildMonthlyEvolution(incomes: Income[], expenses: Expense[], months = 6): EvolutionChartItem[] {
  const currentMonth = getMonthDate(getMonthKey(new Date()));

  return Array.from({ length: months }).map((_, index) => {
    const referenceDate = addMonths(currentMonth, index - (months - 1));
    const monthKey = getMonthKey(referenceDate);

    return {
      monthKey,
      monthLabel: formatMonthTick(monthKey),
      income: incomes
        .filter((item) => item.monthKey === monthKey)
        .reduce((acc, item) => acc + item.amount, 0),
      expenses: expenses
        .filter((item) => item.monthKey === monthKey)
        .reduce((acc, item) => acc + item.amount, 0),
    };
  });
}

function formatMonthTick(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${month}/${year.slice(2)}`;
}
