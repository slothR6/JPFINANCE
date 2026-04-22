"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { Bill, Category, CreditCard, Expense, Income } from "@/types";
import { formatDateShort, formatInvoiceMonth } from "@/lib/dates";
import { getExpenseCreditCardDueAt, sum } from "@/lib/finance";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge, Dot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface Props {
  year: number;
  month: number; // 0-indexed
  incomes: Income[];
  expenses: Expense[];
  bills: Bill[];
  categoryById?: (id: string) => Category | undefined;
  creditCardById?: (id: string) => CreditCard | undefined;
  expenseDate?: (expense: Expense) => string;
  onDayClick?: (date: Date, events: DayEvents) => void;
}

export interface DayEvents {
  incomes: Income[];
  expenses: Expense[];
  bills: Bill[];
}

type SelectedDay = {
  date: Date;
  events: DayEvents;
};

type SummaryTone = "success" | "danger" | "warning";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const summaryClasses: Record<SummaryTone, string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
};

export function FinCalendar({
  year,
  month,
  incomes,
  expenses,
  bills,
  categoryById,
  creditCardById,
  expenseDate,
  onDayClick,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const monthDate = new Date(year, month, 1);
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const firstDayOfWeek = getDay(days[0]); // 0=Sun

  const eventMap = useMemo(() => {
    const map = new Map<string, DayEvents>();

    for (const inc of incomes) {
      const k = inc.receivedAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.incomes.push(inc);
    }
    for (const exp of expenses) {
      const k = expenseDate?.(exp) ?? exp.paidAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.expenses.push(exp);
    }
    for (const bill of bills) {
      if (bill.status === "paid") continue;
      const k = bill.dueAt;
      if (!map.has(k)) map.set(k, { incomes: [], expenses: [], bills: [] });
      map.get(k)!.bills.push(bill);
    }

    return map;
  }, [incomes, expenses, bills, expenseDate]);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-2xs font-medium uppercase tracking-wide text-fg-subtle">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-hairline">
        {/* Empty cells for first week */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[76px] bg-surface-2/30 sm:min-h-[96px]" />
        ))}

        {days.map((day) => {
          const k = format(day, "yyyy-MM-dd");
          const events = eventMap.get(k);
          const totals = getDayTotals(events);
          const summaries = getDaySummaries(events);
          const visibleSummaries = summaries.slice(0, 2);
          const hasIncome = totals.income > 0;
          const hasExpense = totals.expense > 0;
          const hasBill = totals.bills > 0;
          const hasCard = totals.cardExpenses > 0;
          const hasEvents = totals.count > 0;
          const today = isToday(day);

          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (!events) return;
                setSelectedDay({ date: day, events });
                onDayClick?.(day, events);
              }}
              className={cn(
                "relative flex min-h-[76px] flex-col items-start bg-surface p-1.5 text-left transition sm:min-h-[96px] sm:p-2",
                hasEvents && "cursor-pointer hover:bg-surface-2",
                !hasEvents && "cursor-default",
              )}
            >
              <div className="flex w-full items-start justify-between gap-1">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    today && "bg-fg text-bg",
                    !today && "text-fg",
                  )}
                >
                  {format(day, "d")}
                </span>

                {hasEvents && (
                  <div className="flex flex-wrap justify-end gap-0.5 pt-1">
                    {hasIncome && <span className="h-1.5 w-1.5 rounded-full bg-success" title="Receita" />}
                    {hasExpense && <span className="h-1.5 w-1.5 rounded-full bg-danger" title="Despesa" />}
                    {hasBill && <span className="h-1.5 w-1.5 rounded-full bg-warning" title="Conta a pagar" />}
                    {hasCard && <span className="h-1.5 w-1.5 rounded-full bg-info" title="Compra no cartão" />}
                  </div>
                )}
              </div>

              {hasEvents && (
                <div className="mt-1 flex w-full flex-1 flex-col gap-1 overflow-hidden">
                  {visibleSummaries.map((summary) => (
                    <span
                      key={summary.key}
                      className={cn(
                        "block max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-4 tabular-nums",
                        summaryClasses[summary.tone],
                      )}
                    >
                      {summary.label}
                    </span>
                  ))}
                  {totals.count > visibleSummaries.length && (
                    <span className="truncate px-1 text-[10px] leading-4 text-fg-subtle">
                      +{totals.count - visibleSummaries.length} eventos
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs text-fg-muted">
        <Badge tone="success"><Dot className="bg-success" /> Receita</Badge>
        <Badge tone="danger"><Dot className="bg-danger" /> Despesa / Gasto</Badge>
        <Badge tone="warning"><Dot className="bg-warning" /> Vencimento</Badge>
        <Badge tone="info"><Dot className="bg-info" /> Compra no cartão</Badge>
      </div>

      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? format(selectedDay.date, "dd 'de' MMMM", { locale: ptBR }) : ""}
        description={selectedDay ? dayDescription(selectedDay.events) : undefined}
      >
        {selectedDay && (
          <DayDetails
            events={selectedDay.events}
            categoryById={categoryById}
            creditCardById={creditCardById}
          />
        )}
      </Modal>
    </div>
  );
}

function DayDetails({
  events,
  categoryById,
  creditCardById,
}: {
  events: DayEvents;
  categoryById?: (id: string) => Category | undefined;
  creditCardById?: (id: string) => CreditCard | undefined;
}) {
  const totals = getDayTotals(events);
  const cardExpenses = events.expenses.filter((expense) => expense.method === "cartao");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <SummaryBox label="Receitas" value={formatCurrency(totals.income)} tone="success" />
        <SummaryBox label="Despesas" value={formatCurrency(totals.expense)} tone="danger" />
        <SummaryBox label="Vencimentos" value={formatCurrency(totals.bills)} tone="warning" />
        <SummaryBox
          label="Movimento"
          value={formatCurrency(totals.income - totals.expense)}
          tone={totals.income - totals.expense >= 0 ? "success" : "danger"}
        />
      </div>

      {events.incomes.length > 0 && (
        <DetailSection title="Receitas">
          {events.incomes.map((income) => (
            <DetailItem
              key={income.id}
              icon={<ArrowUpRight size={14} />}
              title={income.description}
              meta={categoryById?.(income.categoryId)?.name}
              amount={`+ ${formatCurrency(income.amount)}`}
              tone="success"
            />
          ))}
        </DetailSection>
      )}

      {events.expenses.length > 0 && (
        <DetailSection title="Despesas e gastos">
          {events.expenses.map((expense) => (
            <DetailItem
              key={expense.id}
              icon={<ArrowDownRight size={14} />}
              title={expense.description}
              meta={categoryById?.(expense.categoryId)?.name}
              amount={`- ${formatCurrency(expense.amount)}`}
              tone="danger"
              badge={expense.method === "cartao" ? <Badge tone="info">Cartão</Badge> : undefined}
            />
          ))}
        </DetailSection>
      )}

      {events.bills.length > 0 && (
        <DetailSection title="Vencimentos">
          {events.bills.map((bill) => (
            <DetailItem
              key={bill.id}
              icon={<CalendarClock size={14} />}
              title={bill.description}
              meta="Conta pendente"
              amount={formatCurrency(bill.amount)}
              tone="warning"
            />
          ))}
        </DetailSection>
      )}

      {cardExpenses.length > 0 && (
        <DetailSection title="Compras no cartão">
          {cardExpenses.map((expense) => {
            const card = expense.creditCardId ? creditCardById?.(expense.creditCardId) : undefined;
            const dueAt = getExpenseCreditCardDueAt(expense, card);

            return (
              <DetailItem
                key={`card-${expense.id}`}
                icon={<CreditCardIcon size={14} />}
                title={expense.description}
                meta={[
                  card?.name ?? "Cartão",
                  dueAt ? `Fatura ${formatInvoiceMonth(dueAt)}` : undefined,
                  dueAt ? `vence ${formatDateShort(dueAt)}` : undefined,
                ].filter(Boolean).join(" · ")}
                amount={formatCurrency(expense.amount)}
                tone="info"
              />
            );
          })}
        </DetailSection>
      )}
    </div>
  );
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SummaryTone;
}) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", summaryBorderClasses[tone])}>
      <div className="text-2xs text-fg-subtle">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold tabular-nums text-fg">{value}</div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      <div className="mt-2 divide-y divide-hairline rounded-lg border border-hairline">{children}</div>
    </section>
  );
}

function DetailItem({
  icon,
  title,
  meta,
  amount,
  tone,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  amount: string;
  tone: SummaryTone | "info";
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", detailIconClasses[tone])}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-fg">{title}</div>
          {meta && <div className="truncate text-2xs text-fg-subtle">{meta}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        <span className={cn("text-sm font-semibold tabular-nums", detailAmountClasses[tone])}>{amount}</span>
      </div>
    </div>
  );
}

const summaryBorderClasses: Record<SummaryTone, string> = {
  success: "border-success/20 bg-success/5",
  danger: "border-danger/20 bg-danger/5",
  warning: "border-warning/20 bg-warning/5",
};

const detailIconClasses: Record<SummaryTone | "info", string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

const detailAmountClasses: Record<SummaryTone | "info", string> = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

function getDayTotals(events?: DayEvents) {
  if (!events) {
    return { income: 0, expense: 0, bills: 0, cardExpenses: 0, count: 0 };
  }

  return {
    income: sum(events.incomes.map((item) => item.amount)),
    expense: sum(events.expenses.map((item) => item.amount)),
    bills: sum(events.bills.map((item) => item.amount)),
    cardExpenses: events.expenses.filter((item) => item.method === "cartao").length,
    count: events.incomes.length + events.expenses.length + events.bills.length,
  };
}

function getDaySummaries(events?: DayEvents) {
  const totals = getDayTotals(events);
  const summaries: Array<{ key: string; label: string; tone: SummaryTone }> = [];

  if (totals.income > 0) {
    summaries.push({ key: "income", label: `+ ${formatCalendarMoney(totals.income)}`, tone: "success" });
  }
  if (totals.expense > 0) {
    summaries.push({ key: "expense", label: `- ${formatCalendarMoney(totals.expense)}`, tone: "danger" });
  }
  if (totals.bills > 0) {
    summaries.push({ key: "bills", label: `Vence ${formatCalendarMoney(totals.bills)}`, tone: "warning" });
  }

  return summaries;
}

function dayDescription(events: DayEvents) {
  const totals = getDayTotals(events);
  return `${totals.count} eventos · movimento ${formatCurrency(totals.income - totals.expense)}`;
}

function formatCalendarMoney(value: number) {
  return formatCurrency(value, { compact: true }).replace(",00", "");
}
