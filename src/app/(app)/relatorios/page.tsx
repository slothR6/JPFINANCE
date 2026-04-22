"use client";

import { useMemo, useState } from "react";
import { subMonths } from "date-fns";
import { CalendarClock, CreditCard as CreditCardIcon, Repeat2, Target } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendArea } from "@/components/charts/trend-area";
import { Donut } from "@/components/charts/donut";
import { CategoryBars } from "@/components/charts/category-bars";
import {
  aggregateByCategory,
  billsForMonth,
  debtRemaining,
  expensePaymentStatus,
  expensesForCompetenceMonth,
  getExpenseCompetenceDate,
  getExpenseCreditCardDueAt,
  incomesForMonth,
  pendingExpensesForPayableMonth,
  sum,
} from "@/lib/finance";
import {
  daysUntil,
  formatDateReadable,
  formatDateShort,
  formatInvoiceMonth,
  formatMonthLong,
  formatMonthShort,
  type MonthRef,
  monthRange,
  monthToDate,
  toIso,
} from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Category, CreditCard, Expense, Income } from "@/types";

type TypeFilter = "all" | "income" | "expense" | "pending";

type InvoiceSummary = {
  key: string;
  dueAt: string;
  cardName: string;
  cardColor?: string;
  total: number;
  count: number;
};

type DueItem = {
  key: string;
  description: string;
  amount: number;
  dueAt: string;
  kind: "Conta" | "Despesa";
};

export default function RelatoriosPage() {
  const { incomes, expenses, bills, debts, creditCards, categories, preferences, categoryById, creditCardById } = useData();
  const { month } = useMonth();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");

  const expenseCompetenceDate = (expense: Expense) =>
    getExpenseCompetenceDate(
      expense,
      expense.creditCardId ? creditCardById(expense.creditCardId) : undefined,
    );

  const monthIncomes = useMemo(() => incomesForMonth(incomes, month), [incomes, month]);
  const monthExpenses = useMemo(
    () => expensesForCompetenceMonth(expenses, creditCards, month),
    [expenses, creditCards, month],
  );
  const pendingBills = useMemo(
    () => billsForMonth(bills, month).filter((bill) => bill.status !== "paid"),
    [bills, month],
  );
  const pendingExpenses = useMemo(
    () => pendingExpensesForPayableMonth(expenses, creditCards, month),
    [expenses, creditCards, month],
  );

  const filteredIncomes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (typeFilter === "expense" || typeFilter === "pending") return [];
    return monthIncomes
      .filter((income) => (categoryFilter === "all" ? true : income.categoryId === categoryFilter))
      .filter((income) => (q ? income.description.toLowerCase().includes(q) : true));
  }, [monthIncomes, typeFilter, categoryFilter, query]);

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = typeFilter === "pending" ? pendingExpenses : monthExpenses;
    if (typeFilter === "income") return [];
    return source
      .filter((expense) => (categoryFilter === "all" ? true : expense.categoryId === categoryFilter))
      .filter((expense) => (q ? expense.description.toLowerCase().includes(q) : true));
  }, [monthExpenses, pendingExpenses, typeFilter, categoryFilter, query]);

  const incomeTotal = sum(monthIncomes.map((income) => income.amount));
  const expenseTotal = sum(monthExpenses.map((expense) => expense.amount));
  const pendingBillsTotal = sum(pendingBills.map((bill) => bill.amount));
  const pendingExpensesTotal = sum(pendingExpenses.map((expense) => expense.amount));
  const projectedBalance = incomeTotal - expenseTotal - pendingBillsTotal;
  const realizedExpenseTotal = sum(monthExpenses.filter((expense) => expensePaymentStatus(expense) === "paid").map((expense) => expense.amount));
  const balance = incomeTotal - expenseTotal;
  const activeDebts = debts.filter((debt) => !debt.archived);
  const debtTotal = sum(activeDebts.map(debtRemaining));
  const monthlyBudget = preferences?.monthlyBudget ?? 0;

  const expenseSlices = useMemo(() => slicesForExpenses(filteredExpenses, categoryById), [filteredExpenses, categoryById]);
  const incomeSlices = useMemo(() => slicesForIncomes(filteredIncomes, categoryById), [filteredIncomes, categoryById]);
  const categoryOptions = useMemo(
    () => categoriesForType(categories, typeFilter),
    [categories, typeFilter],
  );
  const compareRows = useMemo(
    () => buildMonthComparison(incomes, expenses, creditCards, month),
    [incomes, expenses, creditCards, month],
  );
  const dueItems = useMemo<DueItem[]>(() => {
    const cardMap = new Map(creditCards.map((card) => [card.id, card]));
    const billItems: DueItem[] = pendingBills.map((bill) => ({
      key: `bill-${bill.id}`,
      description: bill.description,
      amount: bill.amount,
      dueAt: bill.dueAt,
      kind: "Conta",
    }));
    const expenseItems: DueItem[] = pendingExpenses.map((expense) => {
      const card = expense.creditCardId ? cardMap.get(expense.creditCardId) : undefined;
      return {
        key: `expense-${expense.id}`,
        description: expense.description,
        amount: expense.amount,
        dueAt: getExpenseCompetenceDate(expense, card),
        kind: "Despesa",
      };
    });

    return [...billItems, ...expenseItems]
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.description.localeCompare(b.description))
      .slice(0, 8);
  }, [pendingBills, pendingExpenses, creditCards]);

  const invoices = useMemo(
    () => buildInvoiceSummaries(expenses, creditCards, toIso(monthRange(month).start)),
    [expenses, creditCards, month],
  );

  const recurringExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.recurring && (!expense.expenseKind || expense.expenseKind === "despesa"))
        .sort((a, b) => a.description.localeCompare(b.description)),
    [expenses],
  );
  const recurringMonthTotal = sum(
    expensesForCompetenceMonth(recurringExpenses, creditCards, month).map((expense) => expense.amount),
  );

  const categoryGoals = aggregateByCategory(monthExpenses)
    .map((item) => ({ ...item, category: categoryById(item.categoryId) }))
    .filter((item): item is { categoryId: string; total: number; category: Category } => Boolean(item.category))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const filteredIncomeTotal = sum(filteredIncomes.map((income) => income.amount));
  const filteredExpenseTotal = sum(filteredExpenses.map((expense) => expense.amount));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Relatórios"
        title="Entenda seus números"
        description={`${formatMonthLong(month)} · saldo ${formatCurrency(balance)} · projetado ${formatCurrency(projectedBalance)}`}
      />

      <Card>
        <CardBody>
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por descrição..." />
            <Select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as TypeFilter); setCategoryFilter("all"); }}>
              <option value="all">Todos tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="pending">Pendências</option>
            </Select>
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Todas categorias</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary label="Receitas" value={formatCurrency(incomeTotal)} detail={`${monthIncomes.length} lançamentos`} tone="success" />
        <Summary label="Despesas" value={formatCurrency(expenseTotal)} detail={`${formatCurrency(realizedExpenseTotal)} pago`} tone="danger" />
        <Summary label="Pendências" value={formatCurrency(pendingBillsTotal + pendingExpensesTotal)} detail={`${pendingBills.length + pendingExpenses.length} itens`} tone="warning" />
        <Summary label="Dívidas" value={formatCurrency(debtTotal)} detail={`${activeDebts.length} ativas`} tone="neutral" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo dos últimos 6 meses</CardTitle>
          <CardSubtitle>Comparativo de receitas, despesas e tendência de saldo</CardSubtitle>
        </CardHeader>
        <CardBody>
          {incomes.length + expenses.length > 0 ? (
            <TrendArea
              incomes={incomes}
              expenses={expenses}
              referenceDate={monthToDate(month)}
              expenseDate={expenseCompetenceDate}
            />
          ) : (
            <EmptyState title="Sem dados ainda" description="Registre lançamentos para ver o gráfico." className="py-6" />
          )}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onde o dinheiro foi</CardTitle>
            <CardSubtitle>{formatMonthLong(month)}</CardSubtitle>
          </CardHeader>
          <CardBody>
            <Donut data={expenseSlices} total={filteredExpenseTotal} label="Despesas" />
            <div className="mt-6">
              <CategoryBars
                expenses={filteredExpenses}
                categories={categories.filter((category) => category.kind === "expense")}
                limit={8}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição das receitas</CardTitle>
            <CardSubtitle>{formatCurrency(filteredIncomeTotal)} no corte atual</CardSubtitle>
          </CardHeader>
          <CardBody>
            <Donut data={incomeSlices} total={filteredIncomeTotal} label="Receitas" />
            <BreakdownList data={incomeSlices} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo entre meses</CardTitle>
            <CardSubtitle>Receita, despesa e saldo mês a mês</CardSubtitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="border-b border-hairline text-left text-2xs uppercase tracking-wide text-fg-subtle">
                  <tr>
                    <th className="px-5 py-3">Mês</th>
                    <th className="px-5 py-3">Receita</th>
                    <th className="px-5 py-3">Despesa</th>
                    <th className="px-5 py-3">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {compareRows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-5 py-3 font-medium text-fg">{row.label}</td>
                      <td className="px-5 py-3 tabular-nums text-success">{formatCurrency(row.income)}</td>
                      <td className="px-5 py-3 tabular-nums text-danger">{formatCurrency(row.expense)}</td>
                      <td className={row.balance >= 0 ? "px-5 py-3 tabular-nums text-success" : "px-5 py-3 tabular-nums text-danger"}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Vencimentos e pendências</CardTitle>
                <CardSubtitle>Alertas do mês selecionado</CardSubtitle>
              </div>
              <CalendarClock size={18} className="text-warning" />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {dueItems.length === 0 ? (
              <EmptyState title="Sem pendências" description="Não há contas abertas neste mês." className="m-5" />
            ) : (
              <ul className="divide-y divide-hairline">
                {dueItems.map((item) => {
                  const dd = daysUntil(item.dueAt);
                  return (
                    <li key={item.key} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{item.description}</div>
                        <div className="text-2xs text-fg-subtle">{item.kind} · {formatDateReadable(item.dueAt)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-fg">{formatCurrency(item.amount)}</span>
                        <Badge tone={dd < 0 ? "danger" : dd <= 1 ? "warning" : "neutral"}>
                          {dd < 0 ? `${Math.abs(dd)}d atraso` : dd === 0 ? "Hoje" : dd === 1 ? "Amanhã" : `em ${dd}d`}
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Próximas faturas</CardTitle>
                <CardSubtitle>Compras no cartão agrupadas por vencimento</CardSubtitle>
              </div>
              <CreditCardIcon size={18} className="text-info" />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {invoices.length === 0 ? (
              <EmptyState title="Sem faturas próximas" description="Compras no cartão aparecerão aqui." className="m-5" />
            ) : (
              <ul className="divide-y divide-hairline">
                {invoices.map((invoice) => (
                  <li key={invoice.key} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: invoice.cardColor ?? "hsl(var(--info))" }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{invoice.cardName}</div>
                        <div className="truncate text-2xs text-fg-subtle">
                          Fatura {formatInvoiceMonth(invoice.dueAt)} · vence {formatDateShort(invoice.dueAt)} · {invoice.count} compras
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-fg">{formatCurrency(invoice.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Recorrências e assinaturas</CardTitle>
                <CardSubtitle>{formatCurrency(recurringMonthTotal)} previstos no mês</CardSubtitle>
              </div>
              <Repeat2 size={18} className="text-info" />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recurringExpenses.length === 0 ? (
              <EmptyState title="Sem recorrências" description="Despesas recorrentes aparecerão aqui." className="m-5" />
            ) : (
              <ul className="divide-y divide-hairline">
                {recurringExpenses.slice(0, 8).map((expense) => {
                  const category = categoryById(expense.categoryId);
                  return (
                    <li key={expense.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{expense.description}</div>
                        <div className="text-2xs text-fg-subtle">{category?.name ?? "Sem categoria"}</div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-fg">{formatCurrency(expense.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Metas por categoria</CardTitle>
              <CardSubtitle>Comparação com o orçamento mensal global</CardSubtitle>
            </div>
            <Target size={18} className="text-brand" />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {monthlyBudget <= 0 ? (
            <EmptyState title="Orçamento não definido" description="Defina um orçamento mensal para acompanhar metas por categoria." className="py-4" />
          ) : (
            categoryGoals.map((item) => {
              const pct = item.total / monthlyBudget;
              return (
                <div key={item.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.category.color }} />
                      <span className="truncate">{item.category.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-fg">{formatCurrency(item.total)}</span>
                  </div>
                  <Progress value={pct} tone={pct > 0.35 ? "warning" : "brand"} />
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Summary({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
  const valueClass =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-fg";
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
        <p className="mt-1 text-2xs text-fg-subtle">{detail}</p>
      </CardBody>
    </Card>
  );
}

function BreakdownList({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0) return <p className="mt-6 text-xs text-fg-muted">Sem dados no corte atual.</p>;
  return (
    <ul className="mt-6 space-y-2 text-xs">
      {data.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-fg">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate">{item.name}</span>
          </span>
          <span className="shrink-0 tabular-nums font-medium text-fg">{formatCurrency(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function slicesForExpenses(expenses: Expense[], categoryById: (id: string) => Category | undefined) {
  return aggregateByCategory(expenses)
    .map((item) => {
      const category = categoryById(item.categoryId);
      return category ? { name: category.name, value: item.total, color: category.color } : null;
    })
    .filter(Boolean) as { name: string; value: number; color: string }[];
}

function slicesForIncomes(
  incomes: Array<{ categoryId: string; amount: number }>,
  categoryById: (id: string) => Category | undefined,
) {
  return aggregateByCategory(incomes)
    .map((item) => {
      const category = categoryById(item.categoryId);
      return category ? { name: category.name, value: item.total, color: category.color } : null;
    })
    .filter(Boolean) as { name: string; value: number; color: string }[];
}

function categoriesForType(categories: Category[], type: TypeFilter) {
  if (type === "income") return categories.filter((category) => category.kind === "income");
  if (type === "expense" || type === "pending") return categories.filter((category) => category.kind === "expense");
  return categories;
}

function buildMonthComparison(incomes: Income[], expenses: Expense[], creditCards: CreditCard[], month: MonthRef) {
  return Array.from({ length: 6 }).map((_, index) => {
    const date = subMonths(monthToDate(month), 5 - index);
    const ref = { year: date.getFullYear(), month: date.getMonth() };
    const income = sum(incomesForMonth(incomes, ref).map((item) => item.amount));
    const expense = sum(expensesForCompetenceMonth(expenses, creditCards, ref).map((item) => item.amount));
    return {
      label: formatMonthShort(ref),
      income,
      expense,
      balance: income - expense,
    };
  });
}

function buildInvoiceSummaries(expenses: Expense[], creditCards: CreditCard[], startIso: string) {
  const cardMap = new Map(creditCards.map((card) => [card.id, card]));
  const invoices = new Map<string, InvoiceSummary>();

  for (const expense of expenses) {
    if (expense.method !== "cartao") continue;
    const card = expense.creditCardId ? cardMap.get(expense.creditCardId) : undefined;
    const dueAt = getExpenseCreditCardDueAt(expense, card);
    if (!dueAt || dueAt < startIso) continue;

    const key = `${expense.creditCardId ?? "sem-cartao"}-${dueAt}`;
    const invoice = invoices.get(key) ?? {
      key,
      dueAt,
      cardName: card?.name ?? "Cartão",
      cardColor: card?.color,
      total: 0,
      count: 0,
    };
    invoice.total += expense.amount;
    invoice.count += 1;
    invoices.set(key, invoice);
  }

  return Array.from(invoices.values())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.cardName.localeCompare(b.cardName))
    .slice(0, 8);
}
