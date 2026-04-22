"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { Bill, BillStatus } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { todayIso } from "@/lib/dates";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { Trash2 } from "lucide-react";

const schema = z.object({
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  dueAt: z.string().min(1, "Data obrigatória"),
  categoryId: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue"]),
  paidAt: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Bill | null;
}

export function BillForm({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { categories } = useData();
  const { toast } = useToast();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense" && !c.archived),
    [categories],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          description: editing.description,
          amount: editing.amount,
          dueAt: editing.dueAt,
          categoryId: editing.categoryId,
          status: editing.status,
          paidAt: editing.paidAt,
          note: editing.note ?? "",
        }
      : {
          description: "",
          amount: 0,
          dueAt: todayIso(),
          categoryId: expenseCategories[0]?.id ?? "",
          status: "pending" as BillStatus,
          paidAt: undefined,
          note: "",
        },
  });

  const status = form.watch("status");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    const payload = { ...values };
    if (payload.status !== "paid") payload.paidAt = undefined;
    if (payload.status === "paid" && !payload.paidAt) payload.paidAt = todayIso();
    try {
      if (editing) {
        await updateItem<Bill>(user.uid, COL.bills, editing.id, payload);
        toast({ tone: "success", title: "Conta atualizada" });
      } else {
        await createItem<Omit<Bill, "id">>(user.uid, COL.bills, payload as Omit<Bill, "id">);
        toast({ tone: "success", title: "Conta registrada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to save bill.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.bills, editing.id);
      toast({ tone: "success", title: "Conta excluída" });
      onClose();
    } catch (err) {
      logDevError("Failed to delete bill.", err);
      toast({ tone: "error", title: "Erro ao excluir", description: friendlyDataError(err) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar conta" : "Nova conta a pagar"}
      description={editing ? undefined : "Acompanhe vencimentos e não perca prazos."}
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
            {editing ? "Salvar" : "Registrar conta"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Descrição" required error={form.formState.errors.description?.message}>
          <Input autoFocus placeholder="Ex: Luz, internet, cartão..." {...form.register("description")} />
        </Field>

        <FieldRow>
          <Field label="Valor" required error={form.formState.errors.amount?.message}>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Vence em" required error={form.formState.errors.dueAt?.message}>
            <Input type="date" {...form.register("dueAt")} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Categoria">
            <Select {...form.register("categoryId")}>
              <option value="">Sem categoria</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              <option value="pending">Pendente</option>
              <option value="paid">Paga</option>
              <option value="overdue">Vencida</option>
            </Select>
          </Field>
        </FieldRow>

        {status === "paid" && (
          <Field label="Paga em">
            <Input type="date" {...form.register("paidAt")} />
          </Field>
        )}

        <Field label="Observações (opcional)">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>
      </form>
    </Drawer>
  );
}
