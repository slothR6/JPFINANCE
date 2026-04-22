"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { COL, createItem, deleteItem, updateItem } from "@/services/repository";
import type { Category, CategoryKind } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CATEGORY_COLORS } from "@/lib/constants";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Informe um nome"),
  color: z.string().min(1),
  kind: z.enum(["income", "expense"]),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Category | null;
  defaultKind?: CategoryKind;
}

export function CategoryForm({ open, onClose, editing, defaultKind = "expense" }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? { name: editing.name, color: editing.color, kind: editing.kind }
      : { name: "", color: CATEGORY_COLORS[0], kind: defaultKind },
  });

  const selected = form.watch("color");
  const kind = form.watch("kind");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      if (editing) {
        await updateItem<Category>(user.uid, COL.categories, editing.id, values);
        toast({ tone: "success", title: "Categoria atualizada" });
      } else {
        await createItem<Omit<Category, "id">>(user.uid, COL.categories, values);
        toast({ tone: "success", title: "Categoria criada" });
      }
      onClose();
      form.reset();
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
      const msg = (err as { code?: string })?.code?.includes("permission")
        ? "Sem permissão. Verifique se as regras do Firestore foram publicadas."
        : "Erro ao salvar. Verifique o console para detalhes.";
      toast({ tone: "error", title: "Erro ao salvar", description: msg });
    }
  });

  const onDelete = async () => {
    if (!user || !editing) return;
    try {
      await deleteItem(user.uid, COL.categories, editing.id);
      toast({ tone: "success", title: "Categoria removida" });
      onClose();
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
      toast({ tone: "error", title: "Erro ao excluir" });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar categoria" : "Nova categoria"}
      description="Organize suas receitas e despesas."
      footer={
        <>
          {editing && (
            <Button variant="ghost" onClick={onDelete} iconLeft={<Trash2 size={14} />}>
              Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={form.formState.isSubmitting}>
            Salvar
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Nome" required error={form.formState.errors.name?.message}>
          <Input autoFocus placeholder="Ex: Mercado, Lazer, Salário..." {...form.register("name")} />
        </Field>

        <Field label="Tipo">
          <div className="inline-flex rounded-lg border border-hairline bg-surface-2 p-0.5">
            {(["income", "expense"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => form.setValue("kind", k)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition",
                  kind === k ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg",
                )}
              >
                {k === "income" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>
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
                  selected === c ? "border-fg scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
