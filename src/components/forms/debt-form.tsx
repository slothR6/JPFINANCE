"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Debt } from "@/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const debtSchema = z.object({
  name: z.string().min(2, "Informe o nome da dívida."),
  creditor: z.string().min(2, "Informe o credor."),
  originalAmount: z.coerce.number().positive("Informe um valor original válido."),
  currentAmount: z.coerce.number().nonnegative("Informe o saldo atual."),
  startDate: z.string().min(1, "Informe a data de início."),
  notes: z.string().optional(),
  status: z.enum(["ativa", "negociada", "quitada"]),
});

type DebtFormValues = z.infer<typeof debtSchema>;

export function DebtForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues?: Partial<Debt>;
  onSubmit: (values: DebtFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: initialValues?.name || "",
      creditor: initialValues?.creditor || "",
      originalAmount: initialValues?.originalAmount || 0,
      currentAmount: initialValues?.currentAmount || 0,
      startDate: initialValues?.startDate || new Date().toISOString().slice(0, 10),
      notes: initialValues?.notes || "",
      status: initialValues?.status || "ativa",
    },
  });

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <FormField label="Nome da dívida" error={errors.name?.message}>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          placeholder="Ex.: cartão renegociado"
          {...register("name")}
        />
      </FormField>

      <FormField label="Credor" error={errors.creditor?.message}>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          placeholder="Ex.: banco, financeira, pessoa"
          {...register("creditor")}
        />
      </FormField>

      <FormField label="Valor original" error={errors.originalAmount?.message}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("originalAmount")}
        />
      </FormField>

      <FormField label="Valor atual" error={errors.currentAmount?.message}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("currentAmount")}
        />
      </FormField>

      <FormField label="Data de início" error={errors.startDate?.message}>
        <input
          type="date"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("startDate")}
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <select
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("status")}
        >
          <option value="ativa">Ativa</option>
          <option value="negociada">Negociada</option>
          <option value="quitada">Quitada</option>
        </select>
      </FormField>

      <div className="md:col-span-2">
        <FormField label="Observações" error={errors.notes?.message}>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            placeholder="Informações importantes da negociação"
            {...register("notes")}
          />
        </FormField>
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar dívida"}
        </Button>
      </div>
    </form>
  );
}

