"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/layout/list-row";
import { BillForm } from "@/components/forms/bill-form";
import { useToast } from "@/components/providers/toast-provider";
import { COL, updateItem } from "@/services/repository";
import { daysUntil, formatDateReadable, todayIso } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { sum } from "@/lib/finance";
import type { Bill } from "@/types";

type Tab = "upcoming" | "paid" | "all";

export default function ContasPage() {
  const { user } = useAuth();
  const { bills, categoryById } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);

  const sorted = useMemo(() => [...bills].sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [bills]);

  const pending = sorted.filter((b) => b.status !== "paid");
  const paid = sorted.filter((b) => b.status === "paid");
  const totalPending = sum(pending.map((b) => b.amount));
  const overdue = pending.filter((b) => daysUntil(b.dueAt) < 0);

  const items = tab === "upcoming" ? pending : tab === "paid" ? paid.reverse() : sorted;

  const markPaid = async (b: Bill) => {
    if (!user) return;
    try {
      await updateItem<Bill>(user.uid, COL.bills, b.id, { status: "paid", paidAt: todayIso() });
      toast({ tone: "success", title: "Conta marcada como paga" });
    } catch {
      toast({ tone: "error", title: "Erro" });
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Contas a pagar"
        title="Seus compromissos"
        description="Acompanhe vencimentos e evite juros."
        actions={<Button iconLeft={<Plus size={15} />} onClick={() => { setEditing(null); setOpen(true); }}>Nova conta</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Em aberto" value={formatCurrency(totalPending)} detail={`${pending.length} contas`} tone="default" />
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
              description="Cadastre contas como luz, internet, assinaturas e cartão."
              action={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} iconLeft={<Plus size={14} />}>Nova conta</Button>}
              className="m-5"
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {items.map((b) => {
                const cat = b.categoryId ? categoryById(b.categoryId) : undefined;
                const dd = daysUntil(b.dueAt);
                const isPaid = b.status === "paid";
                const tone = isPaid ? "success" : dd < 0 ? "danger" : dd <= 3 ? "warning" : "neutral";
                const label = isPaid
                  ? "Paga"
                  : dd < 0
                    ? `${Math.abs(dd)}d atraso`
                    : dd === 0
                      ? "Vence hoje"
                      : `em ${dd}d`;
                return (
                  <li key={b.id} className="flex items-stretch">
                    <div className="flex-1">
                      <ListRow
                        onClick={() => { setEditing(b); setOpen(true); }}
                        dot={cat?.color || "#94a3b8"}
                        title={b.description}
                        subtitle={`Vence em ${formatDateReadable(b.dueAt)}`}
                        tags={
                          <>
                            <Badge tone={tone}>{label}</Badge>
                            {cat && <Badge tone="neutral">{cat.name}</Badge>}
                          </>
                        }
                        right={
                          <span className="font-display text-sm font-semibold text-fg tabular-nums">
                            {formatCurrency(b.amount)}
                          </span>
                        }
                      />
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => markPaid(b)}
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
    </div>
  );
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
