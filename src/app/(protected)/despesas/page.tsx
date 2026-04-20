"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Modal } from "@/components/ui/modal";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { EXPENSE_FILTERS } from "@/lib/constants";
import { getExpenseDisplayStatus } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAuth } from "@/hooks/use-auth";
import { useHouseholdData } from "@/hooks/use-household-data";
import { useMonthParam } from "@/hooks/use-month";
import {
  addExpense,
  deleteExpense,
  markExpenseAsPaid,
  markExpenseAsPending,
  updateExpense,
} from "@/services/household-service";
import type { Expense } from "@/types";

export default function DespesasPage() {
  const { user } = useAuth();
  const { householdId, expenses, settings, loading, ensureRecurringForMonth } = useHouseholdData();
  const { monthKey, selectedMonthDate, goToNextMonth, goToPreviousMonth } = useMonthParam();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState<(typeof EXPENSE_FILTERS)[number]["id"]>("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    ensureRecurringForMonth(monthKey).catch(console.error);
  }, [ensureRecurringForMonth, monthKey]);

  const monthExpenses = useMemo(() => expenses.filter((item) => item.monthKey === monthKey), [expenses, monthKey]);
  const filteredExpenses = useMemo(
    () =>
      monthExpenses.filter((expense) => {
        const displayStatus = getExpenseDisplayStatus(expense);
        const matchesSearch = expense.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "todas" || expense.category === categoryFilter;
        const matchesStatus = statusFilter === "todas" || displayStatus === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [categoryFilter, monthExpenses, search, statusFilter],
  );
  const totalExpenses = monthExpenses.reduce((acc, item) => acc + item.amount, 0);
  const paidExpenses = monthExpenses.filter((item) => item.status === "pago").reduce((acc, item) => acc + item.amount, 0);
  const overdueExpenses = monthExpenses
    .filter((item) => getExpenseDisplayStatus(item) === "atrasado")
    .reduce((acc, item) => acc + item.amount, 0);

  async function handleSave(values: {
    description: string;
    amount: number;
    category: string;
    dueDate: string;
    status: "pendente" | "pago";
    responsible?: Expense["responsible"];
    notes?: string;
    isRecurring: boolean;
  }) {
    try {
      if (editingExpense) {
        await updateExpense(householdId, editingExpense.id, {
          ...values,
          recurrenceKey: editingExpense.recurrenceKey || editingExpense.id,
          paidAt: values.status === "pago" ? editingExpense.paidAt || values.dueDate : null,
        });
      } else {
        await addExpense(householdId, values, user?.email);
      }

      setEditingExpense(null);
      setFormOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível salvar a despesa.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir esta despesa?")) {
      return;
    }

    try {
      await deleteExpense(householdId, id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  async function togglePayment(expense: Expense) {
    try {
      if (expense.status === "pago") {
        await markExpenseAsPending(householdId, expense.id);
      } else {
        await markExpenseAsPaid(householdId, expense.id);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível atualizar o pagamento.");
    }
  }

  if (loading) {
    return <LoadingScreen label="Carregando despesas..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saídas"
        title="Despesas do mês"
        description="Controle o que vence, o que já foi pago e o que está atrasando. Recorrências geram os próximos lançamentos automaticamente."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <MonthNavigator currentMonth={selectedMonthDate} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />
            <Button
              className="gap-2"
              onClick={() => {
                setEditingExpense(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova despesa
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total do mês" value={totalExpenses} helper="Todas as despesas do mês selecionado." tone="negative" />
        <StatCard title="Total pago" value={paidExpenses} helper="O que já saiu de fato da conta." tone="positive" />
        <StatCard title="Atrasadas" value={overdueExpenses} helper="Soma do que já passou do vencimento." tone="negative" />
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_200px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
              placeholder="Buscar por descrição"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            {settings.expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof EXPENSE_FILTERS)[number]["id"])}
          >
            {EXPENSE_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            title="Nenhuma despesa encontrada"
            description="Ajuste a busca, troque os filtros ou cadastre uma nova despesa para o mês selecionado."
          />
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              const displayStatus = getExpenseDisplayStatus(expense);

              return (
                <div
                  key={expense.id}
                  className="grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 xl:grid-cols-[1.3fr_0.7fr_0.8fr_0.7fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950 dark:text-slate-100">
                        {expense.description}
                      </p>
                      {expense.isRecurring ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          Recorrente
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{expense.category}</p>
                    {expense.notes ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{expense.notes}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vencimento</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatDate(expense.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Responsável</p>
                    <p className="mt-1 text-sm capitalize text-slate-700 dark:text-slate-200">
                      {expense.responsible === "nao-definido" ? "Não definido" : expense.responsible}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(expense.amount)}
                    </p>
                    <StatusPill status={displayStatus} />
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant={expense.status === "pago" ? "secondary" : "success"}
                      onClick={() => togglePayment(expense)}
                    >
                      {expense.status === "pago" ? "Voltar p/ pendente" : "Marcar como paga"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingExpense(expense);
                        setFormOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(expense.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Editar despesa" : "Nova despesa"}
      >
        <ExpenseForm
          categories={settings.expenseCategories}
          initialValues={editingExpense || undefined}
          onCancel={() => {
            setFormOpen(false);
            setEditingExpense(null);
          }}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  );
}
