"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { Debt, DebtKind } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { todayIso } from "@/lib/dates";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    name: z.string().min(1, "Informe um nome"),
    creditor: z.string().optional(),
    debtKind: z.enum(["negociada", "mapeada"]),
    totalAmount: z.number().positive("Valor deve ser maior que zero"),
    installments: z.coerce.number().int().min(1).optional(),
    paidInstallments: z.coerce.number().int().min(0).optional(),
    installmentAmount: z.number().positive().optional(),
    firstDueAt: z.string().optional(),
    interestRate: z.coerce.number().optional(),
    note: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.debtKind === "negociada") {
      if (!val.installments || val.installments < 1) {
        ctx.addIssue({ code: "custom", path: ["installments"], message: "Informe o número de parcelas" });
      }
      if (!val.installmentAmount || val.installmentAmount <= 0) {
        ctx.addIssue({ code: "custom", path: ["installmentAmount"], message: "Informe o valor da parcela" });
      }
      if (!val.firstDueAt) {
        ctx.addIssue({ code: "custom", path: ["firstDueAt"], message: "Informe a data do primeiro vencimento" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Debt | null;
}

export function DebtForm({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          name: editing.name,
          creditor: editing.creditor ?? "",
          debtKind: editing.debtKind ?? "negociada",
          totalAmount: editing.totalAmount,
          installments: editing.installments,
          paidInstallments: editing.paidInstallments,
          installmentAmount: editing.installmentAmount,
          firstDueAt: editing.firstDueAt,
          interestRate: editing.interestRate,
          note: editing.note ?? "",
        }
      : {
          name: "",
          creditor: "",
          debtKind: "negociada",
          totalAmount: 0,
          installments: 1,
          paidInstallments: 0,
          installmentAmount: 0,
          firstDueAt: todayIso(),
          interestRate: undefined,
          note: "",
        },
  });

  const debtKind = form.watch("debtKind");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const payload: Omit<Debt, "id"> = {
        name: values.name,
        creditor: values.creditor || undefined,
        debtKind: values.debtKind,
        totalAmount: values.totalAmount,
        installments: values.debtKind === "negociada" ? values.installments : undefined,
        paidInstallments: values.debtKind === "negociada" ? (values.paidInstallments ?? 0) : undefined,
        installmentAmount: values.debtKind === "negociada" ? values.installmentAmount : undefined,
        firstDueAt: values.debtKind === "negociada" ? values.firstDueAt : undefined,
        interestRate: values.interestRate || undefined,
        note: values.note || undefined,
      };
      if (editing) {
        await updateItem<Debt>(user.uid, COL.debts, editing.id, payload);
        toast({ tone: "success", title: "Dívida atualizada" });
      } else {
        await createItem<Omit<Debt, "id">>(user.uid, COL.debts, payload);
        toast({ tone: "success", title: "Dívida registrada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to save debt.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.debts, editing.id);
      toast({ tone: "success", title: "Dívida removida" });
      onClose();
    } catch (err) {
      logDevError("Failed to delete debt.", err);
      toast({ tone: "error", title: "Erro ao excluir", description: friendlyDataError(err) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar dívida" : "Nova dívida"}
      description={editing ? undefined : "Registre uma dívida negociada ou apenas mapeie uma que existe."}
      size="lg"
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
            {editing ? "Salvar" : "Registrar dívida"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Tipo de dívida */}
        <Field label="Tipo de dívida">
          <div className="inline-flex rounded-lg border border-hairline bg-surface-2 p-0.5">
            {(["negociada", "mapeada"] as DebtKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => form.setValue("debtKind", k, { shouldValidate: true })}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition",
                  debtKind === k ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg",
                )}
              >
                {k === "negociada" ? "Negociada" : "Mapeada (sem detalhes)"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-2xs text-fg-subtle">
            {debtKind === "negociada"
              ? "Dívida com parcelas definidas, credor e vencimentos conhecidos."
              : "Dívida que você sabe que existe mas ainda não tem condições definidas."}
          </p>
        </Field>

        <FieldRow>
          <Field label="Nome" required error={form.formState.errors.name?.message}>
            <Input autoFocus placeholder="Ex: Financiamento carro" {...form.register("name")} />
          </Field>
          <Field label="Credor">
            <Input placeholder="Ex: Banco X" {...form.register("creditor")} />
          </Field>
        </FieldRow>

        <Field label="Valor total" required error={form.formState.errors.totalAmount?.message}>
          <Controller
            name="totalAmount"
            control={form.control}
            render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
          />
        </Field>

        {debtKind === "negociada" && (
          <>
            <FieldRow>
              <Field label="Valor da parcela" required error={form.formState.errors.installmentAmount?.message}>
                <Controller
                  name="installmentAmount"
                  control={form.control}
                  render={({ field }) => <MoneyInput value={field.value ?? 0} onChange={field.onChange} />}
                />
              </Field>
              <Field label="Juros ao mês (%)" hint="Opcional">
                <Input type="number" step="0.01" placeholder="0,00" {...form.register("interestRate")} />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Parcelas totais" required error={form.formState.errors.installments?.message}>
                <Input type="number" min={1} {...form.register("installments")} />
              </Field>
              <Field label="Parcelas já pagas">
                <Input type="number" min={0} {...form.register("paidInstallments")} />
              </Field>
            </FieldRow>

            <Field label="Primeiro vencimento" required error={form.formState.errors.firstDueAt?.message}>
              <Input type="date" {...form.register("firstDueAt")} />
            </Field>
          </>
        )}

        <Field label="Observações">
          <Textarea placeholder="Anotações..." {...form.register("note")} />
        </Field>
      </form>
    </Drawer>
  );
}
