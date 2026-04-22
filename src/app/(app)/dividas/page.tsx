"use client";

import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DebtForm } from "@/components/forms/debt-form";
import { DebtPaymentForm } from "@/components/forms/debt-payment-form";
import { debtProgress, debtRemaining, sum } from "@/lib/finance";
import { formatDateReadable } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Debt } from "@/types";

export default function DividasPage() {
  const { debts } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState<Debt | null>(null);

  const active = debts
    .filter((d) => !d.archived)
    .sort((a, b) => (a.firstDueAt ?? "").localeCompare(b.firstDueAt ?? ""));

  const totalOpen = sum(active.map(debtRemaining));
  const totalPaid = sum(
    active.map((d) => (d.paidInstallments ?? 0) * (d.installmentAmount ?? 0)),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Dívidas"
        title="Rumo à liberdade financeira"
        description="Acompanhe parcelas, saldo devedor e progresso de quitação."
        actions={
          <Button iconLeft={<Plus size={15} />} onClick={() => { setEditing(null); setOpen(true); }}>
            Nova dívida
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-fg-muted">Saldo devedor</p>
            <p className="mt-1 font-display text-2xl font-semibold text-fg tabular-nums">
              {formatCurrency(totalOpen)}
            </p>
            <p className="mt-1 text-2xs text-fg-subtle">{active.length} dívidas ativas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-fg-muted">Já quitado</p>
            <p className="mt-1 font-display text-2xl font-semibold text-success tabular-nums">
              {formatCurrency(totalPaid)}
            </p>
            <p className="mt-1 text-2xs text-fg-subtle">do valor original</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-fg-muted">Ativas</p>
            <p className="mt-1 font-display text-2xl font-semibold text-fg tabular-nums">
              {active.length}
            </p>
            <p className="mt-1 text-2xs text-fg-subtle">em acompanhamento</p>
          </CardBody>
        </Card>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={<Landmark size={22} />}
          title="Sem dívidas registradas"
          description="Cadastre financiamentos, parcelamentos e empréstimos para acompanhar sua quitação."
          action={
            <Button onClick={() => { setEditing(null); setOpen(true); }} iconLeft={<Plus size={14} />}>
              Registrar primeira dívida
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((d) => {
            const p = debtProgress(d);
            const remaining = debtRemaining(d);
            const isMapeada = d.debtKind === "mapeada";
            return (
              <Card key={d.id}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-fg">{d.name}</h3>
                      {d.creditor && <p className="text-xs text-fg-muted">{d.creditor}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={isMapeada ? "warning" : "neutral"}>
                        {isMapeada ? "Mapeada" : `${d.paidInstallments ?? 0}/${d.installments ?? "?"}`}
                      </Badge>
                    </div>
                  </div>

                  {!isMapeada && (
                    <div>
                      <div className="mb-1.5 flex items-end justify-between text-xs">
                        <span className="text-fg-muted">Progresso</span>
                        <span className="font-medium text-fg tabular-nums">{Math.round(p * 100)}%</span>
                      </div>
                      <Progress value={p} tone={p >= 1 ? "success" : "brand"} />
                    </div>
                  )}

                  {isMapeada ? (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <MiniStat label="Valor estimado" value={formatCurrency(remaining)} />
                      {d.note && (
                        <div className="col-span-2 rounded-lg bg-surface-2/40 p-3 text-2xs text-fg-muted">
                          {d.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <MiniStat label="Em aberto" value={formatCurrency(remaining)} />
                      <MiniStat label="Parcela" value={formatCurrency(d.installmentAmount ?? 0)} />
                      <MiniStat label="Total" value={formatCurrency(d.totalAmount)} />
                      <MiniStat label="Início" value={formatDateReadable(d.firstDueAt)} />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(d); setOpen(true); }}>
                      Editar
                    </Button>
                    {!isMapeada && (
                      <Button
                        size="sm"
                        disabled={p >= 1}
                        onClick={() => { setPaying(d); setPayOpen(true); }}
                      >
                        Registrar pagamento
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <DebtForm open={open} onClose={() => setOpen(false)} editing={editing} />
      <DebtPaymentForm open={payOpen} onClose={() => setPayOpen(false)} debt={paying} />
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
