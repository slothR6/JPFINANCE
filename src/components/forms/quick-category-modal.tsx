"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { COL, createItem } from "@/services/repository";
import type { Category, CategoryKind } from "@/types";
import { CATEGORY_COLORS } from "@/lib/constants";
import { friendlyDataError, logDevError } from "@/lib/errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Informe um nome"),
  color: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  kind: CategoryKind;
  onClose: () => void;
  onCreated: (categoryId: string) => void;
}

export function QuickCategoryModal({ open, kind, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", color: CATEGORY_COLORS[0] },
  });
  const selected = form.watch("color");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const id = await createItem<Omit<Category, "id">>(user.uid, COL.categories, {
        ...values,
        kind,
      });
      toast({ tone: "success", title: "Categoria criada" });
      onCreated(id);
      onClose();
      form.reset();
    } catch (err) {
      logDevError("Failed to quick-create category.", err);
      toast({ tone: "error", title: "Erro ao salvar", description: friendlyDataError(err) });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kind === "income" ? "Nova categoria de receita" : "Nova categoria de despesa"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={form.formState.isSubmitting}>
            Criar categoria
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Nome" required error={form.formState.errors.name?.message}>
          <Input autoFocus placeholder={kind === "income" ? "Ex: Rendimentos" : "Ex: Mercado"} {...form.register("name")} />
        </Field>
        <Field label="Cor">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => form.setValue("color", color)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition",
                  selected === color ? "scale-110 border-fg" : "border-transparent",
                )}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
