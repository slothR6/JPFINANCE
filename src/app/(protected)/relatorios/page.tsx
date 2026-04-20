"use client";

import { useEffect, useMemo } from "react";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { IncomeVsExpenseChart } from "@/components/charts/income-vs-expense-chart";
import { MonthlyEvolutionChart } from "@/components/charts/monthly-evolution-chart";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useHouseholdData } from "@/hooks/use-household-data";
import { useMonthParam } from "@/hooks/use-month";
import { buildMonthlyEvolution, getExpenseDisplayStatus, getMonthlySummary, groupExpensesByCategory } from "@/lib/finance";
import { formatCurrency } from "@/lib/formatters";

export default function RelatoriosPage() {
  const { incomes, expenses, debts, debtPayments, settings, loading, ensureRecurringForMonth } =
    useHouseholdData();
  const { monthKey, selectedMonthDate, goToNextMonth, goToPreviousMonth } = useMonthParam();

  useEffect(() => {
    ensureRecurringForMonth(monthKey).catch(console.error);
  }, [ensureRecurringForMonth, monthKey]);

  const monthlyIncomes = useMemo(() => incomes.filter((item) => item.monthKey === monthKey), [incomes, monthKey]);
  const monthlyExpenses = useMemo(() => expenses.filter((item) => item.monthKey === monthKey), [expenses, monthKey]);
  const monthlyDebtPayments = useMemo(
    () => debtPayments.filter((item) => item.paymentDate.startsWith(monthKey)),
    [debtPayments, monthKey],
  );
  const summary = useMemo(
    () =>
      getMonthlySummary({
        incomes: monthlyIncomes,
        expenses: monthlyExpenses,
        debts,
        debtPayments: monthlyDebtPayments,
        monthlyBudget: settings.monthlyBudget,
        alertThreshold: settings.alertThreshold,
      }),
    [debts, monthlyDebtPayments, monthlyExpenses, monthlyIncomes, settings.alertThreshold, settings.monthlyBudget],
  );
  const categoryData = useMemo(() => groupExpensesByCategory(monthlyExpenses), [monthlyExpenses]);
  const evolutionData = useMemo(() => buildMonthlyEvolution(incomes, expenses), [expenses, incomes]);
  const overdueTotal = monthlyExpenses
    .filter((expense) => getExpenseDisplayStatus(expense) === "atrasado")
    .reduce((acc, item) => acc + item.amount, 0);

  if (loading) {
    return <LoadingScreen label="Montando relatórios..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análises"
        title="Relatórios mensais"
        description="Visão sintética do mês com entradas, saídas, pendências, vencidos, dívidas e distribuição por categoria."
        action={
          <MonthNavigator currentMonth={selectedMonthDate} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Entradas" value={summary.totalIncome} helper="Receitas totais do mês filtrado." tone="positive" />
        <StatCard title="Saídas" value={summary.totalExpenses} helper="Despesas totais do mês filtrado." tone="negative" />
        <StatCard title="Saldo final" value={summary.projectedBalance} helper="Receitas menos despesas do mês." health={summary.health} />
        <StatCard title="Dívidas atuais" value={summary.debtBalance} helper="Saldo de dívidas abertas na casa." tone="negative" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total pago</p>
          <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(summary.paidExpenses)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total pendente</p>
          <p className="font-display text-3xl font-bold text-amber-600 dark:text-amber-300">
            {formatCurrency(summary.pendingExpenses)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total vencido</p>
          <p className="font-display text-3xl font-bold text-rose-600 dark:text-rose-300">
            {formatCurrency(overdueTotal)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <IncomeVsExpenseChart income={summary.totalIncome} expenses={summary.totalExpenses} title="Entradas x saídas do mês" />
        {categoryData.length > 0 ? (
          <CategoryDonutChart data={categoryData} title="Peso das categorias no mês" />
        ) : (
          <EmptyState
            title="Sem categorias para exibir"
            description="Lance despesas neste mês para preencher o relatório por categoria."
          />
        )}
      </div>

      <MonthlyEvolutionChart data={evolutionData} />

      <Card className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
            Ranking de categorias
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lista ordenada das categorias que mais consumiram orçamento no mês selecionado.
          </p>
        </div>

        {categoryData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma categoria disponível para o período.</p>
        ) : (
          <div className="space-y-3">
            {categoryData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
