"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { HouseholdSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const settingsSchema = z.object({
  householdName: z.string().min(2, "Informe o nome do lar."),
  monthlyBudget: z.coerce.number().nonnegative("Informe um orçamento válido."),
  alertThreshold: z.coerce.number().min(1).max(100),
  incomeCategoriesText: z.string().min(2, "Informe ao menos uma categoria."),
  expenseCategoriesText: z.string().min(2, "Informe ao menos uma categoria."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm({
  settings,
  onSubmit,
}: {
  settings: HouseholdSettings;
  onSubmit: (values: Omit<HouseholdSettings, "updatedAt" | "id">) => Promise<void> | void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      householdName: settings.householdName,
      monthlyBudget: settings.monthlyBudget,
      alertThreshold: settings.alertThreshold,
      incomeCategoriesText: settings.incomeCategories.join("\n"),
      expenseCategoriesText: settings.expenseCategories.join("\n"),
    },
  });

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          householdId: settings.householdId,
          householdName: values.householdName,
          monthlyBudget: values.monthlyBudget,
          alertThreshold: values.alertThreshold,
          incomeCategories: values.incomeCategoriesText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          expenseCategories: values.expenseCategoriesText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        });
      })}
    >
      <FormField label="Nome do lar compartilhado" error={errors.householdName?.message}>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("householdName")}
        />
      </FormField>

      <FormField label="Meta de orçamento mensal" error={errors.monthlyBudget?.message}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("monthlyBudget")}
        />
      </FormField>

      <FormField label="Limite visual para alerta (%)" error={errors.alertThreshold?.message}>
        <input
          type="number"
          min="1"
          max="100"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
          {...register("alertThreshold")}
        />
      </FormField>

      <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
        <FormField label="Categorias de receita" error={errors.incomeCategoriesText?.message} hint="Uma por linha">
          <textarea
            rows={8}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            {...register("incomeCategoriesText")}
          />
        </FormField>

        <FormField label="Categorias de despesa" error={errors.expenseCategoriesText?.message} hint="Uma por linha">
          <textarea
            rows={8}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700"
            {...register("expenseCategoriesText")}
          />
        </FormField>
      </div>

      <div className="md:col-span-2 flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
