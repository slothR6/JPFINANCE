"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { Expense, ExpenseKind } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { getCreditCardDueDate, todayIso, formatDateBr } from "@/lib/dates";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  paidAt: z.string().min(1, "Data obrigatória"),
  expenseKind: z.enum(["despesa", "gasto"]).optional(),
  method: z.enum(["pix", "cartao", "dinheiro", "boleto", "transferencia", "outros"]).optional(),
  creditCardId: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
}

export function ExpenseForm({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { categories, creditCards } = useData();
  const { toast } = useToast();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense" && !c.archived),
    [categories],
  );
  const activeCards = useMemo(
    () => creditCards.filter((c) => !c.archived),
    [creditCards],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          description: editing.description,
          amount: editing.amount,
          categoryId: editing.categoryId,
          paidAt: editing.paidAt,
          expenseKind: editing.expenseKind,
          method: editing.method,
          creditCardId: editing.creditCardId ?? "",
          note: editing.note ?? "",
        }
      : {
          description: "",
          amount: 0,
          categoryId: expenseCategories[0]?.id ?? "",
          paidAt: todayIso(),
          expenseKind: "despesa",
          method: "pix",
          creditCardId: "",
          note: "",
        },
  });

  const expenseKind = form.watch("expenseKind");
  const method = form.watch("method");
  const creditCardId = form.watch("creditCardId");
  const paidAt = form.watch("paidAt");

  const selectedCard = useMemo(
    () => activeCards.find((c) => c.id === creditCardId),
    [activeCards, creditCardId],
  );

  const creditCardDueAt = useMemo(() => {
    if (!selectedCard || !paidAt) return null;
    return getCreditCardDueDate(paidAt, selectedCard.closingDay, selectedCard.dueDay);
  }, [selectedCard, paidAt]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const payload: Omit<Expense, "id"> = {
        description: values.description,
        amount: values.amount,
        categoryId: values.categoryId,
        paidAt: values.paidAt,
        expenseKind: values.expenseKind,
        method: values.method,
        creditCardId: values.creditCardId || undefined,
        creditCardDueAt: creditCardDueAt ?? undefined,
        note: values.note || undefined,
      };
      if (editing) {
        await updateItem<Expense>(user.uid, COL.expenses, editing.id, payload);
        toast({ tone: "success", title: "Despesa atualizada" });
      } else {
        await createItem<Omit<Expense, "id">>(user.uid, COL.expenses, payload);
        toast({ tone: "success", title: "Despesa registrada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      toast({ tone: "error", title: "Erro ao salvar" });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.expenses, editing.id);
      toast({ tone: "success", title: "Despesa excluída" });
      onClose();
    } catch {
      toast({ tone: "error", title: "Erro ao excluir" });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar despesa" : "Nova despesa"}
      description={editing ? undefined : "Registre o que saiu da sua conta."}
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
            {editing ? "Salvar alterações" : "Registrar despesa"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Tipo: despesa ou gasto */}
        <Field label="Tipo">
          <div className="flex gap-2">
            {(["despesa", "gasto"] as ExpenseKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => form.setValue("expenseKind", k)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                  expenseKind === k
                    ? "border-fg bg-fg text-bg"
                    : "border-hairline bg-surface-2/40 text-fg-muted hover:border-border hover:text-fg",
                )}
              >
                {k === "despesa" ? "Despesa" : "Gasto do dia"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-2xs text-fg-subtle">
            {expenseKind === "gasto"
              ? "Gastos avulsos do cotidiano (almoço, café, lazer)"
              : "Despesas regulares (mercado, contas, parcelas)"}
          </p>
        </Field>

        <Field label="Descrição" required error={form.formState.errors.description?.message}>
          <Input autoFocus placeholder={expenseKind === "gasto" ? "Ex: Almoço no restaurante" : "Ex: Mercado do mês"} {...form.register("description")} />
        </Field>

        <FieldRow>
          <Field label="Valor" required error={form.formState.errors.amount?.message}>
            <Controller
              name="amount"
              control={form.control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          </Field>
          <Field label="Data" required error={form.formState.errors.paidAt?.message}>
            <Input type="date" {...form.register("paidAt")} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Categoria" required error={form.formState.errors.categoryId?.message}>
            <Select {...form.register("categoryId")}>
              {expenseCategories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Forma de pagamento">
            <Select {...form.register("method")}
              onChange={(e) => {
                form.setValue("method", e.target.value as FormValues["method"]);
                if (e.target.value !== "cartao") form.setValue("creditCardId", "");
              }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>

        {/* Cartão de crédito */}
        {method === "cartao" && activeCards.length > 0 && (
          <Field label="Cartão de crédito" hint="Opcional">
            <Select {...form.register("creditCardId")}>
              <option value="">Nenhum (débito/genérico)</option>
              {activeCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.lastDigits ? ` •••• ${c.lastDigits}` : ""}
                </option>
              ))}
            </Select>
            {creditCardDueAt && (
              <p className="mt-1.5 text-2xs text-info">
                Fatura prevista para: <strong>{formatDateBr(creditCardDueAt)}</strong>
              </p>
            )}
          </Field>
        )}

        <Field label="Observações (opcional)">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>
      </form>
    </Drawer>
  );
}
