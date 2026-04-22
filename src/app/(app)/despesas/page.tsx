"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Receipt, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { useToast } from "@/components/providers/toast-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/layout/list-row";
import { ExpenseForm } from "@/components/forms/expense-form";
import { expensePaymentStatus, expensesForMonth, getExpenseCreditCardDueAt, sum } from "@/lib/finance";
import { formatDateReadable, formatDateShort, formatInvoiceMonth, formatMonthLong, todayIso } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { COL, deleteFieldValue, updateItem } from "@/services/repository";
import { friendlyDataError, logDevError } from "@/lib/errors";
import type { Expense } from "@/types";

type StatusFilter = "all" | "pending" | "paid";

export default function DespesasPage() {
  const { user } = useAuth();
  const { expenses, categories, categoryById, creditCardById } = useData();
  const { month } = useMonth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const expenseCategories = categories.filter((c) => c.kind === "expense");

  const monthly = useMemo(() => expensesForMonth(expenses, month), [expenses, month]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return monthly
      .filter((e) => (ql ? e.description.toLowerCase().includes(ql) : true))
      .filter((e) => (cat === "all" ? true : e.categoryId === cat))
      .filter((e) => (status === "all" ? true : expensePaymentStatus(e) === status))
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  }, [monthly, q, cat, status]);

  const total = sum(filtered.map((e) => e.amount));

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (e: Expense) => {
    const baseExpense = e.recurringBaseId
      ? expenses.find((item) => item.id === e.recurringBaseId)
      : e;
    setEditing(baseExpense ?? e);
    setOpen(true);
  };

  const togglePaid = async (expense: Expense) => {
    if (!user) return;
    const shouldMarkPaid = expensePaymentStatus(expense) !== "paid";
    try {
      await updateItem<Expense>(user.uid, COL.expenses, expense.id, {
        paymentStatus: shouldMarkPaid ? "paid" : "pending",
        paidOn: shouldMarkPaid ? todayIso() : deleteFieldValue(),
      });
      toast({ tone: "success", title: shouldMarkPaid ? "Despesa marcada como paga" : "Despesa voltou para pendente" });
    } catch (err) {
      logDevError("Failed to update expense status.", err);
      toast({ tone: "error", title: "Erro", description: friendlyDataError(err) });
    }
  };

  const methodLabel = (m?: Expense["method"]) =>
    PAYMENT_METHODS.find((p) => p.value === m)?.label ?? "—";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Despesas"
        title="Tudo o que saiu"
        description={`${formatMonthLong(month)} · ${filtered.length} lançamentos · ${formatCurrency(total)}`}
        actions={<Button iconLeft={<Plus size={15} />} onClick={openNew}>Nova despesa</Button>}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Lançamentos do mês</CardTitle>
              <CardSubtitle>Refine por categoria, status ou palavra-chave</CardSubtitle>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Input
                placeholder="Buscar..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="sm:w-52"
              />
              <Select value={cat} onChange={(e) => setCat(e.target.value)} className="sm:w-44">
                <option value="all">Todas categorias</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="sm:w-36">
                <option value="all">Todos status</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagas</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Receipt size={22} />}
              title="Sem despesas por aqui"
              description="Registre seus gastos para manter o controle do mês."
              action={<Button onClick={openNew} iconLeft={<Plus size={14} />} size="sm">Adicionar despesa</Button>}
              className="m-5"
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((e) => {
                const c = categoryById(e.categoryId);
                const cardDueAt = getExpenseCreditCardDueAt(
                  e,
                  e.creditCardId ? creditCardById(e.creditCardId) : undefined,
                );
                const isPaid = expensePaymentStatus(e) === "paid";
                return (
                  <li key={e.id} className="flex items-stretch">
                    <div className="min-w-0 flex-1">
                      <ListRow
                        onClick={() => openEdit(e)}
                        dot={c?.color}
                        title={e.description}
                        subtitle={formatDateReadable(e.paidAt)}
                        tags={
                          <>
                            <Badge tone={isPaid ? "success" : "warning"}>{isPaid ? "Paga" : "Pendente"}</Badge>
                            {c && <Badge tone="neutral">{c.name}</Badge>}
                            <Badge tone="neutral">{methodLabel(e.method)}</Badge>
                            {e.recurring && <Badge tone="info">Recorrente</Badge>}
                            {e.method === "cartao" && cardDueAt && (
                              <>
                                <Badge tone="info">Fatura {formatInvoiceMonth(cardDueAt)}</Badge>
                                <Badge tone="neutral">Vence {formatDateShort(cardDueAt)}</Badge>
                              </>
                            )}
                          </>
                        }
                        right={
                          <span className="font-display text-sm font-semibold text-fg tabular-nums">
                            − {formatCurrency(e.amount)}
                          </span>
                        }
                      />
                    </div>
                    <button
                      onClick={() => void togglePaid(e)}
                      className={
                        "flex min-w-[4.75rem] items-center justify-center gap-1 border-l border-hairline px-3 text-xs font-medium transition " +
                        (isPaid ? "text-fg-muted hover:bg-surface-2 hover:text-fg" : "text-success hover:bg-success/10")
                      }
                      title={isPaid ? "Voltar para pendente" : "Marcar como paga"}
                    >
                      {isPaid ? <RotateCcw size={14} /> : <Check size={14} />}
                      <span className="hidden sm:inline">{isPaid ? "Pendente" : "Pagar"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <ExpenseForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
