"use client";

import { useEffect, useMemo, type ComponentType } from "react";
import { AlarmClockCheck, CreditCard, HandCoins, Wallet } from "lucide-react";
import { CategoryDonutChart } from "@/components/charts/category-donut-chart";
import { IncomeVsExpenseChart } from "@/components/charts/income-vs-expense-chart";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useHouseholdData } from "@/hooks/use-household-data";
import { useMonthParam } from "@/hooks/use-month";
import { getExpenseDisplayStatus, getMonthlySummary, getRecentPayments, groupExpensesByCategory } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { isDateWithinNextDays, isTodayDate } from "@/lib/dates";

export default function DashboardPage() {
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
  const billsToday = useMemo(
    () => expenses.filter((expense) => expense.status !== "pago" && isTodayDate(expense.dueDate)),
    [expenses],
  );
  const billsWeek = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.status !== "pago" &&
          !isTodayDate(expense.dueDate) &&
          isDateWithinNextDays(expense.dueDate, 7),
      ),
    [expenses],
  );
  const recentExpenses = useMemo(
    () => [...monthlyExpenses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [monthlyExpenses],
  );
  const recentPayments = useMemo(
    () => getRecentPayments(monthlyExpenses, monthlyDebtPayments),
    [monthlyDebtPayments, monthlyExpenses],
  );
  const categoryData = useMemo(() => groupExpensesByCategory(monthlyExpenses), [monthlyExpenses]);

  if (loading) {
    return <LoadingScreen label="Preparando o dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumo financeiro"
        title="Dashboard mensal"
        description="Acompanhe o que entrou, o que saiu, o que ainda vence e o sinal de saúde do mês sem misturar dívidas com despesas comuns."
        action={
          <MonthNavigator
            currentMonth={selectedMonthDate}
            onPrevious={goToPreviousMonth}
            onNext={goToNextMonth}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Receitas" value={summary.totalIncome} helper="Total previsto de entradas no mês." tone="positive" />
        <StatCard title="Despesas" value={summary.totalExpenses} helper="Saídas lançadas para o mês selecionado." tone="negative" />
        <StatCard
          title="Saldo previsto"
          value={summary.projectedBalance}
          helper="Receitas menos despesas mensais. Dívidas aparecem separadas."
          health={summary.health}
        />
        <StatCard title="Dívidas" value={summary.debtBalance} helper="Saldo atual consolidado de dívidas abertas." tone="negative" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <IncomeVsExpenseChart income={summary.totalIncome} expenses={summary.totalExpenses} />
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
                Sinais do mês
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Diagnóstico rápido para saber se o mês está confortável ou apertado.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Status financeiro</p>
                <StatusPill status={summary.health} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Orçamento mensal: {formatCurrency(settings.monthlyBudget)}. Total já pago:{" "}
                {formatCurrency(summary.paidExpenses)}. Total pendente: {formatCurrency(summary.pendingExpenses)}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniInfoCard icon={AlarmClockCheck} label="Vence hoje" value={billsToday.length} />
              <MiniInfoCard icon={CreditCard} label="Próx. 7 dias" value={billsWeek.length} />
              <MiniInfoCard icon={HandCoins} label="Pagto. dívidas" value={monthlyDebtPayments.length} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {categoryData.length > 0 ? (
          <CategoryDonutChart data={categoryData} />
        ) : (
          <EmptyState
            title="Ainda não há despesas categorizadas"
            description="Assim que você lançar despesas no mês, o gráfico por categoria aparece aqui."
          />
        )}

        <Card className="space-y-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
              Pagamentos recentes
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inclui despesas marcadas como pagas e pagamentos parciais registrados em dívidas.
            </p>
          </div>

          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum pagamento recente neste mês.</p>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {payment.description}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {payment.type === "despesa" ? "despesa paga" : "pagamento de dívida"} • {formatDate(payment.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card className="space-y-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
              Contas vencendo hoje
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tudo que pede ação imediata no dia atual.</p>
          </div>
          <ExpenseList items={billsToday} emptyLabel="Nenhuma conta vence hoje." />
        </Card>

        <Card className="space-y-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
              Próximos 7 dias
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Contas pendentes que estão se aproximando.</p>
          </div>
          <ExpenseList items={billsWeek} emptyLabel="Nenhuma conta prevista para os próximos 7 dias." />
        </Card>

        <Card className="space-y-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
              Despesas recentes
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Últimos lançamentos ou ajustes do mês selecionado.
            </p>
          </div>
          <ExpenseList items={recentExpenses} emptyLabel="Nenhuma despesa registrada neste mês." />
        </Card>
      </div>
    </div>
  );
}

function MiniInfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ExpenseList({
  items,
  emptyLabel,
}: {
  items: Array<{
    id: string;
    description: string;
    dueDate: string;
    amount: number;
    status: "pendente" | "pago";
  }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.description}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(item.dueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.amount)}</p>
            <StatusPill status={getExpenseDisplayStatus(item)} />
          </div>
        </div>
      ))}
    </div>
  );
}
