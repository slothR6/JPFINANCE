"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { IncomeForm } from "@/components/forms/income-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Modal } from "@/components/ui/modal";
import { MonthNavigator } from "@/components/ui/month-navigator";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/hooks/use-auth";
import { useHouseholdData } from "@/hooks/use-household-data";
import { useMonthParam } from "@/hooks/use-month";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { addIncome, deleteIncome, updateIncome } from "@/services/household-service";
import type { Income } from "@/types";

export default function ReceitasPage() {
  const { user } = useAuth();
  const { householdId, incomes, settings, loading, ensureRecurringForMonth } = useHouseholdData();
  const { monthKey, selectedMonthDate, goToNextMonth, goToPreviousMonth } = useMonthParam();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  useEffect(() => {
    ensureRecurringForMonth(monthKey).catch(console.error);
  }, [ensureRecurringForMonth, monthKey]);

  const monthIncomes = useMemo(() => incomes.filter((item) => item.monthKey === monthKey), [incomes, monthKey]);
  const filteredIncomes = useMemo(
    () =>
      monthIncomes.filter((income) => {
        const matchesSearch = income.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "todas" || income.category === categoryFilter;
        return matchesSearch && matchesCategory;
      }),
    [categoryFilter, monthIncomes, search],
  );
  const totalIncome = useMemo(() => monthIncomes.reduce((acc, item) => acc + item.amount, 0), [monthIncomes]);
  const recurringCount = monthIncomes.filter((item) => item.isRecurring).length;

  async function handleSave(values: {
    description: string;
    amount: number;
    date: string;
    category: string;
    responsible?: Income["responsible"];
    isRecurring: boolean;
  }) {
    try {
      if (editingIncome) {
        await updateIncome(householdId, editingIncome.id, {
          ...values,
          recurrenceKey: editingIncome.recurrenceKey || editingIncome.id,
        });
      } else {
        await addIncome(householdId, values, user?.email);
      }

      setEditingIncome(null);
      setFormOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível salvar a receita.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja excluir esta receita?")) {
      return;
    }

    try {
      await deleteIncome(householdId, id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível excluir.");
    }
  }

  if (loading) {
    return <LoadingScreen label="Carregando receitas..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entradas"
        title="Receitas do mês"
        description="Cadastre tudo que entra em casa e identifique rapidamente quem recebe, de onde vem e o quanto é recorrente."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <MonthNavigator currentMonth={selectedMonthDate} onPrevious={goToPreviousMonth} onNext={goToNextMonth} />
            <Button
              className="gap-2"
              onClick={() => {
                setEditingIncome(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova receita
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total do mês" value={totalIncome} helper="Entradas somadas para o mês selecionado." tone="positive" />
        <StatCard title="Recorrentes" value={recurringCount} helper="Lançamentos que se repetem automaticamente." tone="neutral" />
        <StatCard
          title="Média por lançamento"
          value={monthIncomes.length > 0 ? totalIncome / monthIncomes.length : 0}
          helper="Ajuda a perceber o peso médio de cada entrada."
          tone="positive"
        />
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
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
            {settings.incomeCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {filteredIncomes.length === 0 ? (
          <EmptyState
            title="Nenhuma receita encontrada"
            description="Ajuste os filtros ou cadastre a primeira receita do mês para começar a acompanhar as entradas."
          />
        ) : (
          <div className="space-y-3">
            {filteredIncomes.map((income) => (
              <div
                key={income.id}
                className="grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 lg:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_auto]"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{income.description}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{income.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Data</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatDate(income.date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Responsável</p>
                  <p className="mt-1 text-sm capitalize text-slate-700 dark:text-slate-200">
                    {income.responsible === "nao-definido" ? "Não definido" : income.responsible}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Valor</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(income.amount)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {income.isRecurring ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      Recorrente
                    </span>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingIncome(income);
                      setFormOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(income.id)}>
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingIncome(null);
        }}
        title={editingIncome ? "Editar receita" : "Nova receita"}
      >
        <IncomeForm
          categories={settings.incomeCategories}
          initialValues={editingIncome || undefined}
          onCancel={() => {
            setFormOpen(false);
            setEditingIncome(null);
          }}
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  );
}
