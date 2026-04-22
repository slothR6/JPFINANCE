"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { CreditCard } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Field, FieldRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { CATEGORY_COLORS } from "@/lib/constants";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Informe um nome"),
  lastDigits: z.string().max(4).optional(),
  closingDay: z.coerce.number().int().min(1).max(28, "Dia inválido"),
  dueDay: z.coerce.number().int().min(1).max(28, "Dia inválido"),
  limit: z.number().positive().optional(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: CreditCard | null;
}

export function CreditCardForm({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          name: editing.name,
          lastDigits: editing.lastDigits ?? "",
          closingDay: editing.closingDay,
          dueDay: editing.dueDay,
          limit: editing.limit,
          color: editing.color ?? CATEGORY_COLORS[1],
        }
      : {
          name: "",
          lastDigits: "",
          closingDay: 15,
          dueDay: 5,
          limit: undefined,
          color: CATEGORY_COLORS[1],
        },
  });

  const selectedColor = form.watch("color");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const payload: Omit<CreditCard, "id"> = {
        name: values.name,
        lastDigits: values.lastDigits || undefined,
        closingDay: values.closingDay,
        dueDay: values.dueDay,
        limit: values.limit || undefined,
        color: values.color || undefined,
      };
      if (editing) {
        await updateItem<CreditCard>(user.uid, COL.creditCards, editing.id, payload);
        toast({ tone: "success", title: "Cartão atualizado" });
      } else {
        await createItem<Omit<CreditCard, "id">>(user.uid, COL.creditCards, payload);
        toast({ tone: "success", title: "Cartão cadastrado" });
      }
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to save credit card.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.creditCards, editing.id);
      toast({ tone: "success", title: "Cartão removido" });
      onClose();
    } catch (err) {
      logDevError("Failed to delete credit card.", err);
      toast({ tone: "error", title: "Erro ao excluir", description: friendlyDataError(err) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Editar cartão" : "Novo cartão de crédito"}
      description={editing ? undefined : "Cadastre seu cartão para calcular automaticamente o vencimento da fatura."}
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
            {editing ? "Salvar" : "Cadastrar cartão"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FieldRow>
          <Field label="Nome do cartão" required error={form.formState.errors.name?.message}>
            <Input autoFocus placeholder="Ex: Nubank, Itaú Visa..." {...form.register("name")} />
          </Field>
          <Field label="Últimos 4 dígitos" hint="Opcional">
            <Input placeholder="0000" maxLength={4} {...form.register("lastDigits")} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field
            label="Dia do fechamento"
            hint="Dia do mês que a fatura fecha"
            error={form.formState.errors.closingDay?.message}
          >
            <Input type="number" min={1} max={28} {...form.register("closingDay")} />
          </Field>
          <Field
            label="Dia do vencimento"
            hint="Dia do mês que a fatura vence"
            error={form.formState.errors.dueDay?.message}
          >
            <Input type="number" min={1} max={28} {...form.register("dueDay")} />
          </Field>
        </FieldRow>

        <Field label="Limite do cartão" hint="Opcional">
          <Controller
            name="limit"
            control={form.control}
            render={({ field }) => (
              <MoneyInput value={field.value ?? 0} onChange={field.onChange} />
            )}
          />
        </Field>

        <Field label="Cor">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => form.setValue("color", c)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition",
                  selectedColor === c ? "border-fg scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        {/* Preview */}
        <div
          className="flex items-center gap-3 rounded-xl p-4 text-white"
          style={{ backgroundColor: selectedColor ?? CATEGORY_COLORS[1] }}
        >
          <div className="flex-1">
            <div className="text-xs font-medium opacity-80">Cartão de crédito</div>
            <div className="mt-0.5 text-base font-bold">{form.watch("name") || "Nome do cartão"}</div>
            {form.watch("lastDigits") && (
              <div className="mt-0.5 text-sm opacity-70">•••• {form.watch("lastDigits")}</div>
            )}
          </div>
          <div className="text-right text-xs opacity-80">
            <div>Fecha dia {form.watch("closingDay") || "–"}</div>
            <div>Vence dia {form.watch("dueDay") || "–"}</div>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
