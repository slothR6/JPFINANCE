"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
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
import { todayIso } from "@/lib/dates";
import { Trash2 } from "lucide-react";

const schema = z.object({
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  receivedAt: z.string().min(1, "Data obrigatória"),
  recurring: z.boolean().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Income | null;
}

export function IncomeForm({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { categories } = useData();
  const { toast } = useToast();

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
          note: editing.note ?? "",
        }
      : {
          description: "",
          amount: 0,
          categoryId: incomeCategories[0]?.id ?? "",
          receivedAt: todayIso(),
          recurring: false,
          note: "",
        },
    resetOptions: { keepDirtyValues: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      if (editing) {
        await updateItem<Income>(user.uid, COL.incomes, editing.id, values);
        toast({ tone: "success", title: "Receita atualizada" });
      } else {
        await createItem<Omit<Income, "id">>(user.uid, COL.incomes, values);
        toast({ tone: "success", title: "Receita registrada" });
      }
      onClose();
      form.reset();
    } catch {
      toast({ tone: "error", title: "Erro ao salvar" });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.incomes, editing.id);
      toast({ tone: "success", title: "Receita excluída" });
      onClose();
    } catch {
      toast({ tone: "error", title: "Erro ao excluir" });
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
          <Field label="Valor" required error={form.formState.errors.amount?.message}>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Data do recebimento" required error={form.formState.errors.receivedAt?.message}>
            <Input type="date" {...form.register("receivedAt")} />
          </Field>
        </FieldRow>

        <Field label="Categoria" required error={form.formState.errors.categoryId?.message}>
          <Select {...form.register("categoryId")}>
            {incomeCategories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
            {incomeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observações (opcional)">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>

        <label className="flex items-start gap-2.5 rounded-lg border border-hairline bg-surface-2/60 p-3.5">
          <input type="checkbox" className="mt-0.5 rounded" {...form.register("recurring")} />
          <span className="text-xs">
            <span className="block font-medium text-fg">Receita recorrente</span>
            <span className="text-fg-muted">Marque se esta receita se repete mensalmente.</span>
          </span>
        </label>
      </form>
    </Drawer>
  );
}
