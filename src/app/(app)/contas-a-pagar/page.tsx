"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Plus, RotateCcw, Search } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/layout/list-row";
import { BillForm } from "@/components/forms/bill-form";
import { ExpenseForm } from "@/components/forms/expense-form";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteFieldValue, updateItem } from "@/services/repository";
import { billsForMonth, expensePaymentStatus, expensesForPayableMonth, getExpenseCompetenceDate, getExpenseCreditCardDueAt, sum } from "@/lib/finance";
import { daysUntil, formatDateReadable, formatMonthLong, todayIso } from "@/lib/dates";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";
import type { Bill, Expense } from "@/types";

type Filter = "all" | "pending" | "paid" | "recurring" | "overdue" | "month";
type PayableStatus = "pending" | "paid";

type PayableItem =
  | {
      type: "bill";
      key: string;
      description: string;
      amount: number;
      dueAt: string;
      status: PayableStatus;
      recurring: false;
      categoryId?: string;
      bill: Bill;
    }
  | {
      type: "expense";
      key: string;
      description: string;
      amount: number;
      dueAt: string;
      status: PayableStatus;
      recurring: boolean;
      categoryId?: string;
      expense: Expense;
      synthetic: boolean;
    };

const filterOptions: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "paid", label: "Pagas" },
  { value: "recurring", label: "Recorrentes" },
  { value: "overdue", label: "Vencidas" },
  { value: "month", label: "Deste mês" },
];

export default function ContasPage() {
  const { user } = useAuth();
  const { bills, expenses, creditCards, categoryById, creditCardById } = useData();
  const { month } = useMonth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const items = useMemo<PayableItem[]>(() => {
    const cardMap = new Map(creditCards.map((card) => [card.id, card]));
    const existingExpenseIds = new Set(expenses.map((expense) => expense.id));

    const billItems: PayableItem[] = billsForMonth(bills, month).map((bill) => ({
      type: "bill",
      key: `bill-${bill.id}`,
      description: bill.description,
      amount: bill.amount,
      dueAt: bill.dueAt,
      status: bill.status === "paid" ? "paid" : "pending",
      recurring: false,
      categoryId: bill.categoryId,
      bill,
    }));

    const expenseItems: PayableItem[] = expensesForPayableMonth(expenses, creditCards, month).map((expense) => {
      const card = expense.creditCardId ? cardMap.get(expense.creditCardId) : undefined;
      return {
        type: "expense",
        key: `expense-${expense.id}`,
        description: expense.description,
        amount: expense.amount,
        dueAt: getExpenseCompetenceDate(expense, card),
        status: expensePaymentStatus(expense),
        recurring: Boolean(expense.recurring || expense.recurringOccurrence),
        categoryId: expense.categoryId,
        expense,
        synthetic: Boolean(expense.recurringOccurrence && !existingExpenseIds.has(expense.id)),
      };
    });

    return [...billItems, ...expenseItems].sort(comparePayableItems);
  }, [bills, expenses, creditCards, month]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (filter === "pending") return item.status === "pending";
        if (filter === "paid") return item.status === "paid";
        if (filter === "recurring") return item.recurring;
        if (filter === "overdue") return item.status === "pending" && daysUntil(item.dueAt) < 0;
        return true;
      })
      .filter((item) => {
        if (!q) return true;
        const category = item.categoryId ? categoryById(item.categoryId)?.name.toLowerCase() ?? "" : "";
        return item.description.toLowerCase().includes(q) || category.includes(q);
      });
  }, [items, filter, query, categoryById]);

  const pending = items.filter((item) => item.status === "pending");
  const paid = items.filter((item) => item.status === "paid");
  const overdue = pending.filter((item) => daysUntil(item.dueAt) < 0);
  const dueToday = pending.filter((item) => daysUntil(item.dueAt) === 0);
  const dueTomorrow = pending.filter((item) => daysUntil(item.dueAt) === 1);

  const markBill = async (bill: Bill, paidStatus: boolean) => {
    if (!user) return;
    try {
      await updateItem<Bill>(user.uid, COL.bills, bill.id, {
        status: paidStatus ? "paid" : "pending",
        paidAt: paidStatus ? todayIso() : deleteFieldValue(),
      });
      toast({ tone: "success", title: paidStatus ? "Conta marcada como paga" : "Conta voltou para pendente" });
    } catch (err) {
      logDevError("Failed to update bill payment status.", err);
      toast({ tone: "error", title: "Erro", description: friendlyDataError(err) });
    }
  };

  const markExpense = async (expense: Expense, paidStatus: boolean, synthetic: boolean) => {
    if (!user) return;
    try {
      if (paidStatus && synthetic) {
        const card = expense.creditCardId ? creditCardById(expense.creditCardId) : undefined;
        await createItem<Omit<Expense, "id">>(user.uid, COL.expenses, {
          description: expense.description,
          amount: expense.amount,
          categoryId: expense.categoryId,
          paidAt: expense.paidAt,
          paymentStatus: "paid",
          paidOn: todayIso(),
          expenseKind: expense.expenseKind ?? "despesa",
          recurring: false,
          recurringBaseId: expense.recurringBaseId ?? expense.id.split(":recurring:")[0],
          recurringOccurrence: true,
          method: expense.method,
          creditCardId: expense.creditCardId,
          creditCardDueAt: getExpenseCreditCardDueAt(expense, card),
          note: expense.note,
        });
      } else {
        await updateItem<Expense>(user.uid, COL.expenses, expense.id, {
          paymentStatus: paidStatus ? "paid" : "pending",
          paidOn: paidStatus ? todayIso() : deleteFieldValue(),
        });
      }
      toast({ tone: "success", title: paidStatus ? "Despesa marcada como paga" : "Despesa voltou para pendente" });
    } catch (err) {
      logDevError("Failed to update expense payment status.", err);
      toast({ tone: "error", title: "Erro", description: friendlyDataError(err) });
    }
  };

  const openExpense = (expense: Expense) => {
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
        description={`Contas, despesas e recorrências de ${formatMonthLong(month)}.`}
        actions={<Button iconLeft={<Plus size={15} />} onClick={() => { setEditing(null); setOpen(true); }}>Nova conta</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pendente" value={formatCurrency(sum(pending.map((item) => item.amount)))} detail={`${pending.length} itens no mês`} tone="default" />
        <SummaryCard label="Vencidas" value={`${overdue.length}`} detail={overdue.length ? formatCurrency(sum(overdue.map((item) => item.amount))) : "tudo em dia"} tone={overdue.length ? "danger" : "success"} />
        <SummaryCard label="Hoje / amanhã" value={`${dueToday.length + dueTomorrow.length}`} detail={`${dueToday.length} hoje · ${dueTomorrow.length} amanhã`} tone={dueToday.length || dueTomorrow.length ? "danger" : "success"} />
        <SummaryCard label="Pagas" value={formatCurrency(sum(paid.map((item) => item.amount)))} detail={`${paid.length} itens conciliados`} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Lista do mês</CardTitle>
              <CardSubtitle>Despesas normais, recorrentes e contas avulsas no mesmo lugar</CardSubtitle>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-56">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar..."
                  className="pl-9"
                />
              </div>
              <div className="flex max-w-full overflow-x-auto rounded-lg border border-hairline bg-surface-2 p-0.5">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition " +
                      (filter === option.value ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={22} />}
              title="Nada aqui"
              description="Não há compromissos para o filtro selecionado."
              action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} iconLeft={<Plus size={14} />}>Nova conta</Button>}
              className="m-5"
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((item) => {
                const cat = item.categoryId ? categoryById(item.categoryId) : undefined;
                const dd = daysUntil(item.dueAt);
                const isPaid = item.status === "paid";
                const tone = isPaid ? "success" : dd < 0 ? "danger" : dd <= 1 ? "warning" : "neutral";
                const label = isPaid
                  ? "Paga"
                  : dd < 0
                    ? `${Math.abs(dd)}d atraso`
                    : dd === 0
                      ? "Vence hoje"
                      : dd === 1
                        ? "Vence amanhã"
                        : `em ${dd}d`;

                return (
                  <li key={item.key} className="flex items-stretch">
                    <div className="min-w-0 flex-1">
                      <ListRow
                        onClick={() => {
                          if (item.type === "bill") {
                            setEditing(item.bill);
                            setOpen(true);
                            return;
                          }
                          openExpense(item.expense);
                        }}
                        dot={cat?.color || "#94a3b8"}
                        title={item.description}
                        subtitle={`${item.type === "bill" ? "Vence" : "Prevista"} em ${formatDateReadable(item.dueAt)}`}
                        tags={
                          <>
                            <Badge tone={tone}>{label}</Badge>
                            <Badge tone="neutral">{item.type === "bill" ? "Conta" : "Despesa"}</Badge>
                            {item.recurring && <Badge tone="info">Recorrente</Badge>}
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
                    <button
                      onClick={() => {
                        if (item.type === "bill") {
                          void markBill(item.bill, !isPaid);
                          return;
                        }
                        void markExpense(item.expense, !isPaid, item.synthetic);
                      }}
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
