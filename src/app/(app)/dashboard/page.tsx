"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  Plus,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { FinCalendar } from "@/components/ui/fin-calendar";
import { TrendArea } from "@/components/charts/trend-area";
import { CategoryBars } from "@/components/charts/category-bars";
import {
  debtRemaining,
  expensesForMonth,
  incomesForMonth,
  sum,
} from "@/lib/finance";
import { daysUntil, formatDateReadable, formatMonthLong } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { IncomeForm } from "@/components/forms/income-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { BillForm } from "@/components/forms/bill-form";

export default function DashboardPage() {
  const { user } = useAuth();
  const { incomes, expenses, bills, debts, preferences, categoryById } = useData();
  const { month } = useMonth();

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const monthIncomes = useMemo(() => incomesForMonth(incomes, month), [incomes, month]);
  const monthExpenses = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);

  const incomeTotal = sum(monthIncomes.map((i) => i.amount));
  const expenseTotal = sum(monthExpenses.map((e) => e.amount));

  // Separate despesas and gastos for display
  const monthDespesas = useMemo(
    () => monthExpenses.filter((e) => !e.expenseKind || e.expenseKind === "despesa"),
    [monthExpenses],
  );
  const monthGastos = useMemo(
    () => monthExpenses.filter((e) => e.expenseKind === "gasto"),
    [monthExpenses],
  );
  const despesaTotal = sum(monthDespesas.map((e) => e.amount));
  const gastoTotal = sum(monthGastos.map((e) => e.amount));

  const balance = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.max(0, balance) / incomeTotal : 0;

  const upcoming = bills
    .filter((b) => b.status !== "paid")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 6);

  const activeDebts = debts.filter((d) => !d.archived);
  const debtTotal = sum(activeDebts.map(debtRemaining));

  const budget = preferences?.monthlyBudget ?? 0;
  const budgetUsage = budget > 0 ? Math.min(1, expenseTotal / budget) : 0;

  const hello = greeting();
  const name = (user?.displayName || user?.email?.split("@")[0] || "").split(" ")[0];

  const hasActivity = monthIncomes.length + monthExpenses.length + bills.length + debts.length > 0;

  // Filter bills for the current month for calendar
  const calendarBills = useMemo(
    () => bills.filter((b) => {
      const d = b.dueAt.substring(0, 7);
      const m = `${month.year}-${String(month.month + 1).padStart(2, "0")}`;
      return d === m;
    }),
    [bills, month],
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={formatMonthLong(month)}
        title={`${hello}${name ? `, ${name}` : ""}.`}
        description="Um panorama rápido do seu mês — sem ruído, só o que importa."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" iconLeft={<Receipt size={15} />} onClick={() => setExpenseOpen(true)}>
              Despesa
            </Button>
            <Button size="md" iconLeft={<Plus size={15} />} onClick={() => setIncomeOpen(true)}>
              Receita
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Saldo do mês"
          value={formatCurrency(balance)}
          delta={
            balance >= 0
              ? { value: "positivo", direction: "up", tone: "positive" }
              : { value: "negativo", direction: "down", tone: "negative" }
          }
          icon={<Wallet size={16} />}
          accent="hsl(162 68% 32%)"
        />
        <Stat
          label="Receitas"
          value={formatCurrency(incomeTotal)}
          delta={{ value: `${monthIncomes.length} lançamentos`, direction: "up", tone: "neutral" }}
          icon={<ArrowUpRight size={16} />}
          accent="hsl(152 60% 36%)"
        />
        <Stat
          label="Despesas + Gastos"
          value={formatCurrency(expenseTotal)}
          delta={{ value: `${monthExpenses.length} lançamentos`, direction: "down", tone: "neutral" }}
          icon={<ArrowDownRight size={16} />}
          accent="hsl(0 74% 52%)"
        />
        <Stat
          label="Dívidas em aberto"
          value={formatCurrency(debtTotal)}
          delta={{ value: `${activeDebts.length} ativas`, direction: "flat", tone: "neutral" }}
          icon={<Landmark size={16} />}
          accent="hsl(38 92% 48%)"
        />
      </div>

      {/* PRIMARY ROW — Receitas vs Despesas + Próximos vencimentos */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Receitas vs despesas</CardTitle>
                <CardSubtitle>Últimos 6 meses</CardSubtitle>
              </div>
              <div className="flex items-center gap-3 text-2xs text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" /> Receitas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Despesas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-3">
            {hasActivity ? (
              <TrendArea incomes={incomes} expenses={expenses} />
            ) : (
              <EmptyState
                title="Sem lançamentos ainda"
                description="Registre sua primeira receita ou despesa para ver o gráfico."
                className="py-10"
              />
            )}
          </CardBody>
        </Card>

        {/* Próximos vencimentos */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Próximos vencimentos</CardTitle>
                <CardSubtitle>Suas contas a pagar</CardSubtitle>
              </div>
              <Button size="sm" variant="ghost" iconLeft={<Plus size={14} />} onClick={() => setBillOpen(true)}>
                Nova
              </Button>
            </div>
          </CardHeader>
          <CardBody className="pt-1">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={20} />}
                title="Nada por aqui"
                description="Você não tem contas pendentes."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-hairline -mx-5">
                {upcoming.map((b) => {
                  const dd = daysUntil(b.dueAt);
                  const tone = dd < 0 ? "danger" : dd <= 3 ? "warning" : "neutral";
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{b.description}</div>
                        <div className="text-2xs text-fg-subtle">{formatDateReadable(b.dueAt)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums text-fg">
                          {formatCurrency(b.amount)}
                        </span>
                        <Badge tone={tone}>
                          {dd < 0 ? `${Math.abs(dd)}d atraso` : dd === 0 ? "Hoje" : `em ${dd}d`}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* SECONDARY ROW — Onde o dinheiro foi + breakdown despesa/gasto */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Onde seu dinheiro foi</CardTitle>
            <CardSubtitle>Despesas por categoria no mês</CardSubtitle>
          </CardHeader>
          <CardBody>
            {monthExpenses.length === 0 ? (
              <EmptyState
                title="Sem despesas este mês"
                description="Quando registrar despesas, o gráfico aparecerá aqui."
                className="py-6"
              />
            ) : (
              <CategoryBars
                expenses={monthExpenses}
                categories={
                  Array.from(new Set(monthExpenses.map((e) => e.categoryId)))
                    .map((id) => categoryById(id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c))
                }
              />
            )}
          </CardBody>
        </Card>

        {/* Breakdown despesas vs gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas vs Gastos</CardTitle>
            <CardSubtitle>Distribuição dos seus lançamentos</CardSubtitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-fg">Despesas regulares</span>
                <span className="tabular-nums text-fg">{formatCurrency(despesaTotal)}</span>
              </div>
              <div className="text-2xs text-fg-subtle">{monthDespesas.length} lançamentos (mercado, contas, parcelas)</div>
              <Progress
                value={expenseTotal > 0 ? despesaTotal / expenseTotal : 0}
                tone="brand"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-fg">Gastos do dia a dia</span>
                <span className="tabular-nums text-fg">{formatCurrency(gastoTotal)}</span>
              </div>
              <div className="text-2xs text-fg-subtle">{monthGastos.length} lançamentos (refeições, lazer, compras)</div>
              <Progress
                value={expenseTotal > 0 ? gastoTotal / expenseTotal : 0}
                tone="warning"
              />
            </div>
            {monthGastos.length + monthDespesas.length === 0 && (
              <EmptyState
                title="Sem registros"
                description="Comece registrando uma despesa ou gasto."
                className="py-4"
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* CALENDAR */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Calendário do mês</CardTitle>
              <CardSubtitle>Dias com receitas, despesas e contas a pagar</CardSubtitle>
            </div>
            <Button size="sm" variant="outline" iconLeft={<Plus size={14} />} onClick={() => setExpenseOpen(true)}>
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <FinCalendar
            year={month.year}
            month={month.month}
            incomes={monthIncomes}
            expenses={monthExpenses}
            bills={calendarBills}
          />
        </CardBody>
      </Card>

      {/* BUDGET — lower priority, less prominent */}
      {budget > 0 && (
        <Card className="opacity-90">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Orçamento do mês</CardTitle>
                <CardSubtitle>Seu limite pessoal de gastos</CardSubtitle>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Target size={13} />
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-2xs uppercase tracking-wide text-fg-subtle">Usado</span>
                <span className="text-xs font-medium text-fg-muted tabular-nums">
                  {formatCurrency(expenseTotal)} / {formatCurrency(budget)}
                </span>
              </div>
              <Progress
                value={budgetUsage}
                tone={budgetUsage > 0.9 ? "danger" : budgetUsage > 0.7 ? "warning" : "brand"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Taxa de economia" value={`${(savingsRate * 100).toFixed(0)}%`} />
              <MiniStat label="Disponível" value={formatCurrency(Math.max(0, budget - expenseTotal))} />
              <MiniStat label="Despesas regulares" value={formatCurrency(despesaTotal)} />
              <MiniStat label="Gastos do dia" value={formatCurrency(gastoTotal)} />
            </div>
          </CardBody>
        </Card>
      )}

      {budget === 0 && (
        <div className="rounded-xl border border-dashed border-hairline p-4 text-center text-sm text-fg-subtle">
          Defina um{" "}
          <Link href="/configuracoes" className="font-medium text-fg underline-offset-2 hover:underline">
            orçamento mensal
          </Link>{" "}
          nas configurações para acompanhar seu limite.
        </div>
      )}

      <IncomeForm open={incomeOpen} onClose={() => setIncomeOpen(false)} />
      <ExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <BillForm open={billOpen} onClose={() => setBillOpen(false)} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/40 p-3">
      <div className="text-2xs text-fg-subtle">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-fg tabular-nums">{value}</div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
