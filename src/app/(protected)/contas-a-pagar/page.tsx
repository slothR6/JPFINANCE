"use client";

import { useEffect, useMemo, useState } from "react";
import { BILL_FILTERS } from "@/lib/constants";
import { getExpenseDisplayStatus } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { isDateWithinNextDays, isTodayDate } from "@/lib/dates";
import { useHouseholdData } from "@/hooks/use-household-data";
import { useMonthParam } from "@/hooks/use-month";
import { markExpenseAsPaid, markExpenseAsPending } from "@/services/household-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";

type BillView = (typeof BILL_FILTERS)[number]["id"];

export default function ContasAPagarPage() {
  const { householdId, expenses, loading, ensureRecurringForMonth } = useHouseholdData();
  const { monthKey, selectedMonthDate, goToNextMonth, goToPreviousMonth } = useMonthParam();
  const [view, setView] = useState<BillView>("mes");

  useEffect(() => {
    ensureRecurringForMonth(monthKey).catch(console.error);
  }, [ensureRecurringForMonth, monthKey]);

  const filteredExpenses = useMemo(() => {
    switch (view) {
      case "hoje":
        return expenses.filter((expense) => expense.status !== "pago" && isTodayDate(expense.dueDate));
      case "semana":
        return expenses.filter((expense) => expense.status !== "pago" && isDateWithinNextDays(expense.dueDate, 7));
      case "mes":
        return expenses.filter((expense) => expense.monthKey === monthKey);
      case "atrasadas":
        return expenses.filter((expense) => getExpenseDisplayStatus(expense) === "atrasado");
      case "pendentes":
        return expenses.filter((expense) => expense.monthKey === monthKey && expense.status !== "pago");
      case "pagas":
        return expenses.filter((expense) => expense.monthKey === monthKey && expense.status === "pago");
      default:
        return expenses;
    }
  }, [expenses, monthKey, view]);

  const sortedExpenses = useMemo(
    () => [...filteredExpenses].sort((first, second) => first.dueDate.localeCompare(second.dueDate)),
    [filteredExpenses],
  );

  const totals = useMemo(
    () => ({
      pending: expenses
        .filter((item) => item.monthKey === monthKey && item.status !== "pago")
        .reduce((acc, item) => acc + item.amount, 0),
      overdue: expenses
        .filter((item) => getExpenseDisplayStatus(item) === "atrasado")
        .reduce((acc, item) => acc + item.amount, 0),
      paid: expenses
        .filter((item) => item.monthKey === monthKey && item.status === "pago")
        .reduce((acc, item) => acc + item.amount, 0),
    }),
    [expenses, monthKey],
  );

  async function togglePayment(id: string, isPaid: boolean) {
    try {
      if (isPaid) {
        await markExpenseAsPending(householdId, id);
      } else {
        await markExpenseAsPaid(householdId, id);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível atualizar a conta.");
    }
  }

  if (loading) {
    return <LoadingScreen label="Montando a visão de vencimentos..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vencimentos"
        title="Contas a pagar"
        description="Veja claramente o que vence hoje, nos próximos dias, no mês escolhido e o que já passou da hora de ser pago."
        action={
          <MonthNavigator currentMonth={selectedMonthDate} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pendentes no mês</p>
          <p className="font-display text-3xl font-bold text-amber-600 dark:text-amber-300">
            {formatCurrency(totals.pending)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Atrasadas</p>
          <p className="font-display text-3xl font-bold text-rose-600 dark:text-rose-300">
            {formatCurrency(totals.overdue)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pagas no mês</p>
          <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(totals.paid)}
          </p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {BILL_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant={view === filter.id ? "primary" : "secondary"}
              onClick={() => setView(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {sortedExpenses.length === 0 ? (
          <EmptyState
            title="Nada para mostrar neste filtro"
            description="Troque o filtro ou cadastre novas despesas para acompanhar os vencimentos."
          />
        ) : (
          <div className="space-y-3">
            {sortedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_auto]"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{expense.description}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{expense.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vencimento</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatDate(expense.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Valor</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="flex items-center">
                  <StatusPill status={getExpenseDisplayStatus(expense)} />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant={expense.status === "pago" ? "secondary" : "success"}
                    onClick={() => togglePayment(expense.id, expense.status === "pago")}
                  >
                    {expense.status === "pago" ? "Voltar p/ pendente" : "Marcar como paga"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
