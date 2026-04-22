"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteFieldValue, deleteItem, updateItem } from "@/services/repository";
import type { Expense, ExpenseKind } from "@/types";
import { expensePaymentStatus } from "@/lib/finance";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { getCreditCardDueDate, todayIso, formatDateBr, formatInvoiceMonth } from "@/lib/dates";
import { PAYMENT_METHODS } from "@/lib/constants";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { CreditCard as CreditCardIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickCategoryModal } from "@/components/forms/quick-category-modal";

const schema = z.object({
  description: z.string().min(1, "Informe uma descrição"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  paidAt: z.string().min(1, "Data obrigatória"),
  paymentStatus: z.enum(["pending", "paid"]),
  paidOn: z.string().optional(),
  expenseKind: z.enum(["despesa", "gasto"]).optional(),
  recurring: z.boolean().optional(),
  method: z.enum(["pix", "cartao", "dinheiro", "boleto", "transferencia", "outros"]).optional(),
  creditCardId: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
  initialDate?: string;
}

export function ExpenseForm({ open, onClose, editing, initialDate }: Props) {
  const { user } = useAuth();
  const { categories, creditCards } = useData();
  const { toast } = useToast();
  const [categoryOpen, setCategoryOpen] = useState(false);

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
          paymentStatus: expensePaymentStatus(editing),
          paidOn: editing.paidOn ?? "",
          expenseKind: editing.expenseKind,
          recurring: editing.recurring ?? false,
          method: editing.method,
          creditCardId: editing.creditCardId ?? "",
          note: editing.note ?? "",
        }
      : {
          description: "",
          amount: 0,
          categoryId: expenseCategories[0]?.id ?? "",
          paidAt: initialDate ?? todayIso(),
          paymentStatus: "pending",
          paidOn: "",
          expenseKind: "despesa",
          recurring: false,
          method: "pix",
          creditCardId: "",
          note: "",
        },
  });

  const expenseKind = form.watch("expenseKind");
  const method = form.watch("method");
  const creditCardId = form.watch("creditCardId");
  const paidAt = form.watch("paidAt");
  const paymentStatus = form.watch("paymentStatus");

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
        paymentStatus: values.paymentStatus,
        paidOn: values.paymentStatus === "paid" ? values.paidOn || todayIso() : undefined,
        expenseKind: values.expenseKind,
        recurring: values.expenseKind === "despesa" ? values.recurring : false,
        method: values.method,
        creditCardId: values.creditCardId || undefined,
        creditCardDueAt: creditCardDueAt ?? undefined,
        note: values.note || undefined,
      };
      if (editing) {
        await updateItem<Expense>(user.uid, COL.expenses, editing.id, {
          ...payload,
          paidOn: values.paymentStatus === "paid" ? values.paidOn || todayIso() : deleteFieldValue(),
        });
        toast({ tone: "success", title: "Despesa atualizada" });
      } else {
        await createItem<Omit<Expense, "id">>(user.uid, COL.expenses, payload);
        toast({ tone: "success", title: "Despesa registrada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to save expense.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.expenses, editing.id);
      toast({ tone: "success", title: "Despesa excluída" });
      onClose();
    } catch (err) {
      logDevError("Failed to delete expense.", err);
      toast({ tone: "error", title: "Erro ao excluir", description: friendlyDataError(err) });
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
                onClick={() => {
                  form.setValue("expenseKind", k);
                  if (k === "gasto") {
                    form.setValue("recurring", false);
                    form.setValue("paymentStatus", "paid");
                    form.setValue("paidOn", form.getValues("paidOn") || todayIso());
                  }
                }}
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
          <Field label={paymentStatus === "pending" ? "Vencimento" : "Data"} required error={form.formState.errors.paidAt?.message}>
            <Input type="date" {...form.register("paidAt")} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Categoria" required error={form.formState.errors.categoryId?.message}>
            <div className="flex gap-2">
              <Select {...form.register("categoryId")}>
                {expenseCategories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
                {expenseCategories.map((c) => (
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
        <FieldRow>
          <Field label="Status">
            <Select
              {...form.register("paymentStatus")}
              onChange={(e) => {
                const status = e.target.value as FormValues["paymentStatus"];
                form.setValue("paymentStatus", status);
                if (status === "paid") form.setValue("paidOn", form.getValues("paidOn") || todayIso());
                if (status === "pending") form.setValue("paidOn", "");
              }}
            >
              <option value="pending">Pendente</option>
              <option value="paid">Paga</option>
            </Select>
          </Field>
          {paymentStatus === "paid" ? (
            <Field label="Paga em">
              <Input type="date" {...form.register("paidOn")} />
            </Field>
          ) : (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-warning">
              Esta despesa entra em contas a pagar enquanto estiver pendente.
            </div>
          )}
        </FieldRow>

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
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2 text-xs text-info">
                <CreditCardIcon size={15} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium">
                    Esta compra entrará na Fatura {formatInvoiceMonth(creditCardDueAt)}
                  </div>
                  <div className="text-2xs text-info/80">
                    Vencimento em <strong>{formatDateBr(creditCardDueAt)}</strong>
                  </div>
                </div>
              </div>
            )}
          </Field>
        )}

        <Field label="Observações (opcional)">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>

        {expenseKind === "despesa" && (
          <label className="flex items-start gap-2.5 rounded-lg border border-hairline bg-surface-2/60 p-3.5">
            <input type="checkbox" className="mt-0.5 rounded" {...form.register("recurring")} />
            <span className="text-xs">
              <span className="block font-medium text-fg">Despesa recorrente</span>
              <span className="text-fg-muted">Marque se esta despesa se repete mensalmente.</span>
            </span>
          </label>
        )}
      </form>
      <QuickCategoryModal
        open={categoryOpen}
        kind="expense"
        onClose={() => setCategoryOpen(false)}
        onCreated={(categoryId) => form.setValue("categoryId", categoryId, { shouldDirty: true, shouldValidate: true })}
      />
    </Drawer>
  );
}
