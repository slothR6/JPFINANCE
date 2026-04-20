"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RESPONSIBLE_OPTIONS } from "@/lib/constants";
import type { Expense } from "@/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const expenseSchema = z.object({
  description: z.string().min(2, "Informe uma descrição."),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  category: z.string().min(2, "Escolha uma categoria."),
  dueDate: z.string().min(1, "Informe o vencimento."),
  status: z.enum(["pendente", "pago"]),
  responsible: z.enum(["eu", "esposa", "ambos", "nao-definido"]).optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({
  categories,
  initialValues,
  onSubmit,
  onCancel,
}: {
  categories: string[];
  initialValues?: Partial<Expense>;
  onSubmit: (values: ExpenseFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialValues?.description || "",
      amount: initialValues?.amount || 0,
      category: initialValues?.category || categories[0] || "",
      dueDate: initialValues?.dueDate || new Date().toISOString().slice(0, 10),
      status: initialValues?.status || "pendente",
      responsible: initialValues?.responsible || "nao-definido",
      notes: initialValues?.notes || "",
      isRecurring: initialValues?.isRecurring || false,
    },
  });

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="md:col-span-2">
        <FormField label="Descrição" error={errors.description?.message}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            placeholder="Ex.: aluguel, mercado, internet"
            {...register("description")}
          />
        </FormField>
      </div>

      <FormField label="Valor" error={errors.amount?.message}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("amount")}
        />
      </FormField>

      <FormField label="Categoria" error={errors.category?.message}>
        <select
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("category")}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Vencimento" error={errors.dueDate?.message}>
        <input
          type="date"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("dueDate")}
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message} hint="Atrasado é calculado automaticamente">
        <select
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("status")}
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </FormField>

      <FormField label="Responsável" error={errors.responsible?.message}>
        <select
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm capitalize focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("responsible")}
        >
          {RESPONSIBLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "nao-definido" ? "Não definido" : option}
            </option>
          ))}
        </select>
      </FormField>

      <div className="md:col-span-2">
        <FormField label="Observações" error={errors.notes?.message}>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            placeholder="Detalhes úteis sobre essa despesa"
            {...register("notes")}
          />
        </FormField>
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          <input type="checkbox" className="rounded border-slate-300 text-teal-600" {...register("isRecurring")} />
          Despesa recorrente
        </label>
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar despesa"}
        </Button>
      </div>
    </form>
  );
}
