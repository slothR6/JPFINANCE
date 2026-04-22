"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { addMonths } from "date-fns";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { Income } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { parseISO, todayIso, toIso } from "@/lib/dates";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { QuickCategoryModal } from "@/components/forms/quick-category-modal";

const schema = z
  .object({
    description: z.string().min(1, "Informe uma descrição"),
    amount: z.number().positive("Valor deve ser maior que zero"),
    categoryId: z.string().min(1, "Selecione uma categoria"),
    receivedAt: z.string().min(1, "Data obrigatória"),
    recurring: z.boolean().optional(),
    installment: z.boolean().optional(),
    installments: z.coerce.number().int().min(2, "Mínimo de 2 parcelas").max(120, "Máximo de 120 parcelas").optional(),
    note: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.installment && (!values.installments || values.installments < 2)) {
      ctx.addIssue({
        code: "custom",
        path: ["installments"],
        message: "Informe pelo menos 2 parcelas",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Income | null;
  initialDate?: string;
}

export function IncomeForm({ open, onClose, editing, initialDate }: Props) {
  const { user } = useAuth();
  const { categories } = useData();
  const { toast } = useToast();
  const [categoryOpen, setCategoryOpen] = useState(false);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.kind === "income" && !c.archived),
    [categories],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          description: editing.description,
          amount: editing.amount,
          categoryId: editing.categoryId,
          receivedAt: editing.receivedAt,
          recurring: editing.recurring ?? false,
          installment: false,
          installments: 2,
          note: editing.note ?? "",
        }
      : {
          description: "",
          amount: 0,
          categoryId: incomeCategories[0]?.id ?? "",
          receivedAt: initialDate ?? todayIso(),
          recurring: false,
          installment: false,
          installments: 2,
          note: "",
        },
    resetOptions: { keepDirtyValues: false },
  });

  const installment = form.watch("installment");
  const installments = Number(form.watch("installments") ?? 2);
  const amount = Number(form.watch("amount") ?? 0);
  const installmentCount = Number.isFinite(installments) ? installments : 2;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const basePayload = {
        amount: values.amount,
        categoryId: values.categoryId,
        note: values.note || undefined,
      };

      if (editing) {
        await updateItem<Income>(user.uid, COL.incomes, editing.id, {
          description: values.description,
          ...basePayload,
          receivedAt: values.receivedAt,
          recurring: values.recurring,
        });
        toast({ tone: "success", title: "Receita atualizada" });
      } else if (values.installment) {
        const totalInstallments = values.installments ?? 2;
        const firstDate = parseISO(values.receivedAt);

        for (let index = 0; index < totalInstallments; index += 1) {
          await createItem<Omit<Income, "id">>(user.uid, COL.incomes, {
            description: installmentDescription(values.description, index + 1, totalInstallments),
            ...basePayload,
            receivedAt: toIso(addMonths(firstDate, index)),
            recurring: false,
          });
        }

        toast({
          tone: "success",
          title: "Receita parcelada registrada",
          description: `${totalInstallments} parcelas programadas.`,
        });
      } else {
        await createItem<Omit<Income, "id">>(user.uid, COL.incomes, {
          description: values.description,
          ...basePayload,
          receivedAt: values.receivedAt,
          recurring: values.recurring,
        });
        toast({ tone: "success", title: "Receita registrada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to save income.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.incomes, editing.id);
      toast({ tone: "success", title: "Receita excluída" });
      onClose();
    } catch (err) {
      logDevError("Failed to delete income.", err);
      toast({ tone: "error", title: "Erro ao excluir", description: friendlyDataError(err) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar receita" : "Nova receita"}
      description={editing ? undefined : "Registre o que entrou em sua conta."}
      footer={
        <>
          {editing && (
            <Button type="button" variant="ghost" iconLeft={<Trash2 size={14} />} onClick={onDelete}>
              Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={form.formState.isSubmitting}>
            {editing ? "Salvar alterações" : "Registrar receita"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Descrição" required error={form.formState.errors.description?.message}>
          <Input autoFocus placeholder="Ex: Salário de abril" {...form.register("description")} />
        </Field>

        <FieldRow>
          <Field label={installment ? "Valor da parcela" : "Valor"} required error={form.formState.errors.amount?.message}>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field
            label={installment ? "Data da primeira parcela" : "Data do recebimento"}
            required
            error={form.formState.errors.receivedAt?.message}
          >
            <Input type="date" {...form.register("receivedAt")} />
          </Field>
        </FieldRow>

        {!editing && (
          <label className="flex items-start gap-2.5 rounded-lg border border-hairline bg-surface-2/60 p-3.5">
            <input
              type="checkbox"
              className="mt-0.5 rounded"
              {...form.register("installment", {
                onChange: (event) => {
                  if (event.target.checked) form.setValue("recurring", false);
                },
              })}
            />
            <span className="text-xs">
              <span className="block font-medium text-fg">Receita parcelada</span>
              <span className="text-fg-muted">
                Cria automaticamente uma receita por mês a partir da primeira data.
              </span>
            </span>
          </label>
        )}

        {!editing && installment && (
          <FieldRow>
            <Field label="Número de parcelas" required error={form.formState.errors.installments?.message}>
              <Input type="number" min={2} max={120} {...form.register("installments")} />
            </Field>
            <div className="rounded-lg border border-info/20 bg-info/5 px-3 py-2">
              <div className="text-2xs text-info/80">Total programado</div>
              <div className="mt-0.5 text-sm font-semibold text-info tabular-nums">
                {formatCurrency(amount * installmentCount)}
              </div>
              <div className="text-2xs text-info/80">
                {installmentCount} parcelas de {formatCurrency(amount)}
              </div>
            </div>
          </FieldRow>
        )}

        <Field label="Categoria" required error={form.formState.errors.categoryId?.message}>
          <div className="flex gap-2">
            <Select {...form.register("categoryId")}>
              {incomeCategories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
              {incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 px-3"
              iconLeft={<Plus size={14} />}
              onClick={() => setCategoryOpen(true)}
            >
              Nova
            </Button>
          </div>
        </Field>

        <Field label="Observações (opcional)">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>

        {!installment && (
          <label className="flex items-start gap-2.5 rounded-lg border border-hairline bg-surface-2/60 p-3.5">
            <input type="checkbox" className="mt-0.5 rounded" {...form.register("recurring")} />
            <span className="text-xs">
              <span className="block font-medium text-fg">Receita recorrente</span>
              <span className="text-fg-muted">Marque se esta receita se repete mensalmente.</span>
            </span>
          </label>
        )}
      </form>
      <QuickCategoryModal
        open={categoryOpen}
        kind="income"
        onClose={() => setCategoryOpen(false)}
        onCreated={(categoryId) => form.setValue("categoryId", categoryId, { shouldDirty: true, shouldValidate: true })}
      />
    </Drawer>
  );
}

function installmentDescription(description: string, installment: number, total: number) {
  const suffix = ` (${installment}/${total})`;
  return `${description.slice(0, 140 - suffix.length).trimEnd()}${suffix}`;
}
