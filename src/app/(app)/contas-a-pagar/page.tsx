"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/layout/list-row";
import { BillForm } from "@/components/forms/bill-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { useToast } from "@/components/providers/toast-provider";
import { COL, updateItem } from "@/services/repository";
import { daysUntil, formatDateReadable, formatMonthLong, todayIso } from "@/lib/dates";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";
import { getExpenseCompetenceDate, recurringExpensesForPayableMonth, sum } from "@/lib/finance";
import type { Bill, Expense } from "@/types";

type Tab = "upcoming" | "paid" | "all";

type PayableItem =
  | {
      type: "bill";
      id: string;
      description: string;
      amount: number;
      dueAt: string;
      categoryId?: string;
      bill: Bill;
    }
  | {
      type: "recurringExpense";
      id: string;
      description: string;
      amount: number;
      dueAt: string;
      categoryId?: string;
      expense: Expense;
    };

export default function ContasPage() {
  const { user } = useAuth();
  const { bills, expenses, creditCards, categoryById } = useData();
  const { month } = useMonth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const billItems = useMemo<PayableItem[]>(
    () =>
      [...bills]
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
        .map((bill) => ({
          type: "bill" as const,
          id: `bill-${bill.id}`,
          description: bill.description,
          amount: bill.amount,
          dueAt: bill.dueAt,
          categoryId: bill.categoryId,
          bill,
        })),
    [bills],
  );

  const recurringExpenseItems = useMemo<PayableItem[]>(() => {
    const cardMap = new Map(creditCards.map((card) => [card.id, card]));
    return recurringExpensesForPayableMonth(expenses, creditCards, month)
      .map((expense) => {
        const card = expense.creditCardId ? cardMap.get(expense.creditCardId) : undefined;
        return {
          type: "recurringExpense" as const,
          id: `recurring-expense-${expense.id}`,
          description: expense.description,
          amount: expense.amount,
          dueAt: getExpenseCompetenceDate(expense, card),
          categoryId: expense.categoryId,
          expense,
        };
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }, [expenses, creditCards, month]);

  const pending = useMemo(
    () =>
      [
        ...billItems.filter((item) => item.type === "bill" && item.bill.status !== "paid"),
        ...recurringExpenseItems,
      ].sort(comparePayableItems),
    [billItems, recurringExpenseItems],
  );
  const paid = useMemo(
    () =>
      billItems
        .filter((item) => item.type === "bill" && item.bill.status === "paid")
        .sort((a, b) => b.dueAt.localeCompare(a.dueAt)),
    [billItems],
  );
  const all = useMemo(
    () => [...billItems, ...recurringExpenseItems].sort(comparePayableItems),
    [billItems, recurringExpenseItems],
  );
  const totalPending = sum(pending.map((item) => item.amount));
  const overdue = pending.filter((item) => daysUntil(item.dueAt) < 0);

  const items = tab === "upcoming" ? pending : tab === "paid" ? paid : all;

  const markPaid = async (b: Bill) => {
    if (!user) return;
    try {
      await updateItem<Bill>(user.uid, COL.bills, b.id, { status: "paid", paidAt: todayIso() });
      toast({ tone: "success", title: "Conta marcada como paga" });
    } catch (err) {
      logDevError("Failed to mark bill as paid.", err);
      toast({ tone: "error", title: "Erro", description: friendlyDataError(err) });
    }
  };

  const openRecurringExpense = (expense: Expense) => {
    const baseExpense = expense.recurringBaseId
      ? expenses.find((item) => item.id === expense.recurringBaseId)
      : expense;
    setEditingExpense(baseExpense ?? expense);
    setExpenseOpen(true);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Contas a pagar"
        title="Seus compromissos"
        description={`Contas em aberto e despesas recorrentes de ${formatMonthLong(month)}.`}
        actions={<Button iconLeft={<Plus size={15} />} onClick={() => { setEditing(null); setOpen(true); }}>Nova conta</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Em aberto" value={formatCurrency(totalPending)} detail={`${pending.length} itens`} tone="default" />
        <SummaryCard
          label="Vencidas"
          value={`${overdue.length}`}
          detail={overdue.length ? formatCurrency(sum(overdue.map((b) => b.amount))) : "tudo em dia"}
          tone={overdue.length ? "danger" : "success"}
        />
        <SummaryCard
          label="Pagas"
          value={`${paid.length}`}
          detail={formatCurrency(sum(paid.map((b) => b.amount)))}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista</CardTitle>
              <CardSubtitle>Gerencie cada conta</CardSubtitle>
            </div>
            <div className="inline-flex rounded-lg border border-hairline bg-surface-2 p-0.5">
              {(["upcoming", "paid", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    "px-3 py-1.5 text-xs font-medium rounded-md transition " +
                    (tab === t ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg")
                  }
                >
                  {t === "upcoming" ? "A pagar" : t === "paid" ? "Pagas" : "Todas"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={22} />}
              title="Nada aqui"
              description="Cadastre contas ou despesas recorrentes como luz, internet, assinaturas e cartão."
              action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} iconLeft={<Plus size={14} />}>Nova conta</Button>}
              className="m-5"
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {items.map((item) => {
                const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
                const dd = daysUntil(item.dueAt);
                const isPaid = item.type === "bill" && item.bill.status === "paid";
                const tone = isPaid ? "success" : dd < 0 ? "danger" : dd <= 3 ? "warning" : "neutral";
                const label = isPaid
                  ? "Paga"
                  : dd < 0
                    ? `${Math.abs(dd)}d atraso`
                    : dd === 0
                      ? "Vence hoje"
                      : `em ${dd}d`;
                return (
                  <li key={item.id} className="flex items-stretch">
                    <div className="flex-1">
                      <ListRow
                        onClick={() => {
                          if (item.type === "bill") {
                            setEditing(item.bill);
                            setOpen(true);
                            return;
                          }
                          openRecurringExpense(item.expense);
                        }}
                        dot={cat?.color || "#94a3b8"}
                        title={item.description}
                        subtitle={
                          item.type === "bill"
                            ? `Vence em ${formatDateReadable(item.dueAt)}`
                            : `Prevista para ${formatDateReadable(item.dueAt)}`
                        }
                        tags={
                          <>
                            <Badge tone={tone}>{label}</Badge>
                            {item.type === "recurringExpense" && <Badge tone="info">Recorrente</Badge>}
                            {cat && <Badge tone="neutral">{cat.name}</Badge>}
                          </>
                        }
                        right={
                          <span className="font-display text-sm font-semibold text-fg tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        }
                      />
                    </div>
                    {item.type === "bill" && !isPaid && (
                      <button
                        onClick={() => markPaid(item.bill)}
                        className="flex items-center gap-1 border-l border-hairline px-4 text-xs font-medium text-success transition hover:bg-success/10"
                        title="Marcar como paga"
                      >
                        <Check size={14} />
                        <span className="hidden sm:inline">Pagar</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <BillForm open={open} onClose={() => setOpen(false)} editing={editing} />
      <ExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)} editing={editingExpense} />
    </div>
  );
}

function comparePayableItems(a: PayableItem, b: PayableItem) {
  return a.dueAt.localeCompare(b.dueAt) || a.description.localeCompare(b.description);
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "default" | "success" | "danger";
}) {
  const valueColor =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-fg";
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium text-fg-muted">{label}</p>
        <p className={"mt-1 font-display text-2xl font-semibold tabular-nums " + valueColor}>
          {value}
        </p>
        <p className="mt-1 text-2xs text-fg-subtle">{detail}</p>
      </CardBody>
    </Card>
  );
}
