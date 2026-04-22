"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendArea } from "@/components/charts/trend-area";
import { Donut } from "@/components/charts/donut";
import { CategoryBars } from "@/components/charts/category-bars";
import {
  aggregateByCategory,
  expensesForMonth,
  incomesForMonth,
  sum,
} from "@/lib/finance";
import { formatMonthLong } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";

export default function RelatoriosPage() {
  const { incomes, expenses, categories, categoryById } = useData();
  const { month } = useMonth();

  const monthIncomes = useMemo(() => incomesForMonth(incomes, month), [incomes, month]);
  const monthExpenses = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);
  const incomeTotal = sum(monthIncomes.map((i) => i.amount));
  const expenseTotal = sum(monthExpenses.map((e) => e.amount));
  const balance = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.max(0, balance) / incomeTotal : 0;

  const expenseSlices = useMemo(() => {
    return aggregateByCategory(monthExpenses)
      .map((a) => {
        const c = categoryById(a.categoryId);
        return c ? { name: c.name, value: a.total, color: c.color } : null;
      })
      .filter(Boolean) as { name: string; value: number; color: string }[];
  }, [monthExpenses, categoryById]);

  const incomeSlices = useMemo(() => {
    return aggregateByCategory(monthIncomes)
      .map((a) => {
        const c = categoryById(a.categoryId);
        return c ? { name: c.name, value: a.total, color: c.color } : null;
      })
      .filter(Boolean) as { name: string; value: number; color: string }[];
  }, [monthIncomes, categoryById]);

  const hasData = incomes.length + expenses.length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Relatórios"
        title="Entenda seus números"
        description={`${formatMonthLong(month)} · saldo ${formatCurrency(balance)} · taxa de economia ${(savingsRate * 100).toFixed(0)}%`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Fluxo dos últimos 6 meses</CardTitle>
          <CardSubtitle>Compare receitas e despesas ao longo do tempo</CardSubtitle>
        </CardHeader>
        <CardBody>
          {hasData ? (
            <TrendArea incomes={incomes} expenses={expenses} />
          ) : (
            <EmptyState title="Sem dados ainda" description="Registre lançamentos para ver o gráfico." className="py-6" />
          )}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composição das despesas</CardTitle>
            <CardSubtitle>{formatMonthLong(month)}</CardSubtitle>
          </CardHeader>
          <CardBody>
            <Donut data={expenseSlices} total={expenseTotal} label="Despesas" />
            <div className="mt-6">
              <CategoryBars
                expenses={monthExpenses}
                categories={categories.filter((c) => c.kind === "expense")}
                limit={8}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição das receitas</CardTitle>
            <CardSubtitle>{formatMonthLong(month)}</CardSubtitle>
          </CardHeader>
          <CardBody>
            <Donut data={incomeSlices} total={incomeTotal} label="Receitas" />
            <ul className="mt-6 space-y-2 text-xs">
              {incomeSlices.length === 0 && (
                <li className="text-fg-muted">Sem receitas no período.</li>
              )}
              {incomeSlices.map((s) => (
                <li key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-fg">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="tabular-nums font-medium text-fg">{formatCurrency(s.value)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
