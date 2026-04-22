"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { useMonth } from "@/components/providers/month-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/layout/list-row";
import { IncomeForm } from "@/components/forms/income-form";
import { incomesForMonth, sum } from "@/lib/finance";
import { formatDateReadable, formatMonthLong } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Income } from "@/types";

export default function ReceitasPage() {
  const { incomes, categoryById } = useData();
  const { month } = useMonth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [q, setQ] = useState("");

  const monthly = useMemo(() => incomesForMonth(incomes, month), [incomes, month]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return monthly
      .filter((i) => (ql ? i.description.toLowerCase().includes(ql) : true))
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [monthly, q]);

  const total = sum(filtered.map((i) => i.amount));

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (income: Income) => {
    const baseIncome = income.recurringBaseId
      ? incomes.find((item) => item.id === income.recurringBaseId)
      : income;
    setEditing(baseIncome ?? income);
    setOpen(true);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Receitas"
        title="Tudo o que entrou"
        description={`${formatMonthLong(month)} · ${filtered.length} lançamentos · ${formatCurrency(total)}`}
        actions={<Button iconLeft={<Plus size={15} />} onClick={openNew}>Nova receita</Button>}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lançamentos do mês</CardTitle>
              <CardSubtitle>Organizado do mais recente para o mais antigo</CardSubtitle>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Buscar por descrição..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet size={22} />}
              title="Sem receitas neste mês"
              description="Registre entradas como salário, freelances, rendimentos e extras."
              action={<Button onClick={openNew} iconLeft={<Plus size={14} />} size="sm">Adicionar receita</Button>}
              className="m-5"
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((i) => {
                const cat = categoryById(i.categoryId);
                return (
                  <li key={i.id}>
                    <ListRow
                      onClick={() => openEdit(i)}
                      dot={cat?.color}
                      title={i.description}
                      subtitle={formatDateReadable(i.receivedAt)}
                      tags={
                        <>
                          {cat && <Badge tone="neutral">{cat.name}</Badge>}
                          {i.recurring && <Badge tone="info">Recorrente</Badge>}
                        </>
                      }
                      right={
                        <span className="font-display text-sm font-semibold text-success tabular-nums">
                          + {formatCurrency(i.amount)}
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <IncomeForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
