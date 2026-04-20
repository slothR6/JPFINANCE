"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RESPONSIBLE_OPTIONS } from "@/lib/constants";
import type { Income } from "@/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const incomeSchema = z.object({
  description: z.string().min(2, "Informe uma descrição."),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  date: z.string().min(1, "Informe a data."),
  category: z.string().min(2, "Escolha uma categoria."),
  responsible: z.enum(["eu", "esposa", "ambos", "nao-definido"]).optional(),
  isRecurring: z.boolean(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

export function IncomeForm({
  categories,
  initialValues,
  onSubmit,
  onCancel,
}: {
  categories: string[];
  initialValues?: Partial<Income>;
  onSubmit: (values: IncomeFormValues) => Promise<void> | void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: initialValues?.description || "",
      amount: initialValues?.amount || 0,
      date: initialValues?.date || new Date().toISOString().slice(0, 10),
      category: initialValues?.category || categories[0] || "",
      responsible: initialValues?.responsible || "nao-definido",
      isRecurring: initialValues?.isRecurring || false,
    },
  });

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="md:col-span-2">
        <FormField label="Descrição" error={errors.description?.message}>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            placeholder="Ex.: salário, freelas, reembolso"
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

      <FormField label="Data" error={errors.date?.message}>
        <input
          type="date"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("date")}
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
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          <input type="checkbox" className="rounded border-slate-300 text-teal-600" {...register("isRecurring")} />
          Receita recorrente
        </label>
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar receita"}
        </Button>
      </div>
    </form>
  );
}

