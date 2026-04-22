"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, updateItem } from "@/services/repository";
import type { Debt, DebtPayment } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { todayIso } from "@/lib/dates";

const schema = z.object({
  amount: z.number().positive(),
  paidAt: z.string().min(1),
  installmentNumber: z.coerce.number().int().optional(),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export function DebtPaymentForm({ open, onClose, debt }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: debt?.installmentAmount ?? 0,
      paidAt: todayIso(),
      installmentNumber: (debt?.paidInstallments ?? 0) + 1,
      note: "",
    },
    values: debt
      ? {
          amount: debt.installmentAmount ?? 0,
          paidAt: todayIso(),
          installmentNumber: (debt.paidInstallments ?? 0) + 1,
          note: "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user || !debt) return;
    try {
      await createItem<Omit<DebtPayment, "id">>(user.uid, COL.debtPayments, {
        debtId: debt.id,
        amount: values.amount,
        paidAt: values.paidAt,
        installmentNumber: values.installmentNumber,
        note: values.note,
      });
      await updateItem<Debt>(user.uid, COL.debts, debt.id, {
        paidInstallments: Math.min(debt.installments ?? Infinity, (debt.paidInstallments ?? 0) + 1),
      });
      toast({ tone: "success", title: "Pagamento registrado" });
      onClose();
      form.reset();
    } catch {
      toast({ tone: "error", title: "Erro ao registrar pagamento" });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pagamento"
      description={debt ? `${debt.name} — parcela ${(debt.paidInstallments ?? 0) + 1}/${debt.installments ?? "?"}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={form.formState.isSubmitting}>
            Registrar pagamento
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FieldRow>
          <Field label="Valor pago" required>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Data" required>
            <Input type="date" {...form.register("paidAt")} />
          </Field>
        </FieldRow>
        <Field label="Nº da parcela">
          <Input type="number" min={1} {...form.register("installmentNumber")} />
        </Field>
        <Field label="Observação">
          <Textarea placeholder="Opcional" {...form.register("note")} />
        </Field>
      </form>
    </Modal>
  );
}
