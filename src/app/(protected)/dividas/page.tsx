"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DebtForm } from "@/components/forms/debt-form";
import { DebtPaymentForm } from "@/components/forms/debt-payment-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { useAuth } from "@/hooks/use-auth";
import { useHouseholdData } from "@/hooks/use-household-data";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/formatters";
import { addDebt, recordDebtPayment, updateDebt } from "@/services/household-service";
import type { Debt } from "@/types";

export default function DividasPage() {
  const { user } = useAuth();
  const { householdId, debts, debtPayments, loading } = useHouseholdData();
  const [formOpen, setFormOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const totalCurrent = debts.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalOriginal = debts.reduce((acc, item) => acc + item.originalAmount, 0);
  const totalPaid = useMemo(
    () => debtPayments.reduce((acc, item) => acc + item.amount, 0),
    [debtPayments],
  );

  async function handleDebtSave(values: {
    name: string;
    creditor: string;
    originalAmount: number;
    currentAmount: number;
    startDate: string;
    notes?: string;
    status: "ativa" | "negociada" | "quitada";
  }) {
    try {
      if (editingDebt) {
        await updateDebt(householdId, editingDebt.id, values);
      } else {
        await addDebt(householdId, values, user?.email);
      }

      setEditingDebt(null);
      setFormOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível salvar a dívida.");
    }
  }

  async function handlePayment(values: { amount: number; paymentDate: string; notes?: string }) {
    if (!selectedDebt) {
      return;
    }

    try {
      await recordDebtPayment(
        householdId,
        {
          debtId: selectedDebt.id,
          debtName: selectedDebt.name,
          creditor: selectedDebt.creditor,
          amount: values.amount,
          paymentDate: values.paymentDate,
          notes: values.notes,
        },
        user?.email,
      );

      setPaymentOpen(false);
      setSelectedDebt(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível registrar o pagamento.");
    }
  }

  if (loading) {
    return <LoadingScreen label="Carregando dívidas..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dívidas"
        title="Mapa de dívidas"
        description="Dívidas ficam separadas das despesas mensais. Cada pagamento parcial reduz o saldo automaticamente e preserva o histórico."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditingDebt(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova dívida
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo atual consolidado</p>
          <p className="font-display text-3xl font-bold text-rose-600 dark:text-rose-300">
            {formatCurrency(totalCurrent)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Valor original somado</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalOriginal)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pagamentos registrados</p>
          <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatCurrency(totalPaid)}
          </p>
        </Card>
      </div>

      {debts.length === 0 ? (
        <EmptyState
          title="Nenhuma dívida cadastrada"
          description="Cadastre aqui apenas as dívidas que precisam de controle separado. Parcelas mensais negociadas entram como despesas quando você quiser."
          action={
            <Button
              onClick={() => {
                setEditingDebt(null);
                setFormOpen(true);
              }}
            >
              Cadastrar primeira dívida
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {debts.map((debt) => {
            const progress = debt.originalAmount > 0 ? (1 - debt.currentAmount / debt.originalAmount) * 100 : 0;
            const history = debtPayments
              .filter((payment) => payment.debtId === debt.id)
              .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

            return (
              <Card key={debt.id} className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-bold text-slate-950 dark:text-slate-100">
                      {debt.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{debt.creditor}</p>
                  </div>
                  <StatusPill status={debt.status} />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBlock label="Original" value={formatCurrency(debt.originalAmount)} />
                  <InfoBlock label="Atual" value={formatCurrency(debt.currentAmount)} />
                  <InfoBlock label="Quitado" value={formatPercentage(progress)} />
                </div>

                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Iniciada em {formatDate(debt.startDate)}. {debt.notes ? debt.notes : "Sem observações adicionais."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="success"
                    onClick={() => {
                      setSelectedDebt(debt);
                      setPaymentOpen(true);
                    }}
                  >
                    Registrar pagamento
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingDebt(debt);
                      setFormOpen(true);
                    }}
                  >
                    Editar dívida
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Histórico de pagamentos
                    </h3>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Ainda não há pagamentos registrados para esta dívida.
                    </p>
                  ) : (
                    history.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {formatDate(payment.paymentDate)}
                          </p>
                          {payment.notes ? (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{payment.notes}</p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingDebt(null);
        }}
        title={editingDebt ? "Editar dívida" : "Nova dívida"}
      >
        <DebtForm
          initialValues={editingDebt || undefined}
          onCancel={() => {
            setFormOpen(false);
            setEditingDebt(null);
          }}
          onSubmit={handleDebtSave}
        />
      </Modal>

      <Modal
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setSelectedDebt(null);
        }}
        title={selectedDebt ? `Pagamento parcial: ${selectedDebt.name}` : "Registrar pagamento"}
      >
        {selectedDebt ? (
          <DebtPaymentForm
            maxAmount={selectedDebt.currentAmount}
            onCancel={() => {
              setPaymentOpen(false);
              setSelectedDebt(null);
            }}
            onSubmit={handlePayment}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
