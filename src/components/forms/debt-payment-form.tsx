"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

function createPaymentSchema(maxAmount: number) {
  return z.object({
    amount: z.coerce
      .number()
      .positive("Informe um valor maior que zero.")
      .max(maxAmount, "O pagamento não pode ser maior que o saldo atual."),
    paymentDate: z.string().min(1, "Informe a data do pagamento."),
    notes: z.string().optional(),
  });
}

export function DebtPaymentForm({
  maxAmount,
  onSubmit,
  onCancel,
}: {
  maxAmount: number;
  onSubmit: (values: { amount: number; paymentDate: string; notes?: string }) => Promise<void> | void;
  onCancel: () => void;
}) {
  const schema = createPaymentSchema(maxAmount);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <FormField label="Valor pago" error={errors.amount?.message}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("amount")}
        />
      </FormField>

      <FormField label="Data do pagamento" error={errors.paymentDate?.message}>
        <input
          type="date"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("paymentDate")}
        />
      </FormField>

      <div className="md:col-span-2">
        <FormField label="Observações" error={errors.notes?.message}>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            placeholder="Anote algo útil sobre esse pagamento"
            {...register("notes")}
          />
        </FormField>
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar pagamento"}
        </Button>
      </div>
    </form>
  );
}

