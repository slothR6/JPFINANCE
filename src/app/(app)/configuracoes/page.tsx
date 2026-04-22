"use client";

import { useMemo, useState } from "react";
import { CreditCard as CreditCardIcon, LogOut, Pencil, Plus, Target } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { Field, FieldRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "@/components/forms/category-form";
import { CreditCardForm } from "@/components/forms/credit-card-form";
import { savePreferences } from "@/services/repository";
import type { Category, CategoryKind, CreditCard } from "@/types";
import { initialsFromName } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const { user, signOut } = useAuth();
  const { categories, creditCards, preferences } = useData();
  const { toast } = useToast();

  const [name, setName] = useState<string>(preferences?.displayName ?? user?.displayName ?? "");
  const [budget, setBudget] = useState<number>(preferences?.monthlyBudget ?? 0);
  const [savings, setSavings] = useState<number>(preferences?.savingsGoal ?? 0);
  const [saving, setSaving] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [defaultKind, setDefaultKind] = useState<CategoryKind>("expense");

  const [cardOpen, setCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === "expense").sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.kind === "income").sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferences(user.uid, {
        displayName: name,
        monthlyBudget: budget,
        savingsGoal: savings,
        currency: preferences?.currency ?? "BRL",
        theme: preferences?.theme ?? "system",
      });
      toast({ tone: "success", title: "Preferências atualizadas" });
    } catch {
      toast({ tone: "error", title: "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  const newCategory = (kind: CategoryKind) => {
    setEditingCat(null);
    setDefaultKind(kind);
    setCatOpen(true);
  };

  const editCategory = (c: Category) => {
    setEditingCat(c);
    setDefaultKind(c.kind);
    setCatOpen(true);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configurações"
        title="Seu espaço, do seu jeito"
        description="Gerencie seu perfil, orçamento pessoal e categorias."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Perfil */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                {initialsFromName(name || user?.email || "")}
              </div>
              <div className="min-w-0">
                <CardTitle>{name || user?.email}</CardTitle>
                <CardSubtitle>{user?.email}</CardSubtitle>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field label="Nome de exibição">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </Field>
            <Button variant="outline" onClick={signOut} iconLeft={<LogOut size={14} />}>
              Sair da conta
            </Button>
          </CardBody>
        </Card>

        {/* Orçamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Orçamento pessoal</CardTitle>
                <CardSubtitle>Defina um teto mensal e uma meta de economia</CardSubtitle>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Target size={15} />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <FieldRow>
              <Field label="Orçamento mensal" hint="Limite de despesas no mês">
                <MoneyInput value={budget} onChange={setBudget} />
              </Field>
              <Field label="Meta de economia" hint="Quanto quer guardar por mês">
                <MoneyInput value={savings} onChange={setSavings} />
              </Field>
            </FieldRow>
            <div className="mt-6 flex justify-end">
              <Button onClick={savePrefs} loading={saving}>
                Salvar preferências
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Categorias */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CategoryGroup
          title="Categorias de despesas"
          description="Organize seus gastos em grupos significativos"
          items={expenseCategories}
          onNew={() => newCategory("expense")}
          onEdit={editCategory}
        />
        <CategoryGroup
          title="Categorias de receitas"
          description="Ajuda a entender a origem do seu dinheiro"
          items={incomeCategories}
          onNew={() => newCategory("income")}
          onEdit={editCategory}
        />
      </div>

      {/* Cartões de crédito */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Cartões de crédito</CardTitle>
              <CardSubtitle>Gerencie seus cartões para calcular vencimentos automaticamente</CardSubtitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              iconLeft={<Plus size={14} />}
              onClick={() => { setEditingCard(null); setCardOpen(true); }}
            >
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {creditCards.filter((c) => !c.archived).length === 0 ? (
            <EmptyState
              icon={<CreditCardIcon size={20} />}
              title="Nenhum cartão cadastrado"
              description="Cadastre um cartão para calcular automaticamente quando a fatura será cobrada."
              className="m-5"
            />
          ) : (
            <ul className="grid gap-0 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {creditCards
                .filter((c) => !c.archived)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setEditingCard(c); setCardOpen(true); }}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-surface-2"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                        style={{ backgroundColor: c.color ?? "#0891b2" }}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-fg">
                          {c.name}{c.lastDigits ? ` •••• ${c.lastDigits}` : ""}
                        </div>
                        <div className="text-2xs text-fg-subtle">
                          Fecha dia {c.closingDay} · Vence dia {c.dueDay}
                        </div>
                      </div>
                      <Pencil size={13} className="text-fg-subtle opacity-0 transition group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <CategoryForm
        open={catOpen}
        onClose={() => setCatOpen(false)}
        editing={editingCat}
        defaultKind={defaultKind}
      />
      <CreditCardForm
        open={cardOpen}
        onClose={() => setCardOpen(false)}
        editing={editingCard}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  description,
  items,
  onNew,
  onEdit,
}: {
  title: string;
  description: string;
  items: Category[];
  onNew: () => void;
  onEdit: (c: Category) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardSubtitle>{description}</CardSubtitle>
          </div>
          <Button size="sm" variant="outline" iconLeft={<Plus size={14} />} onClick={onNew}>
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria"
            description="Crie uma para organizar seus lançamentos."
            className="m-5"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-0 p-2 sm:grid-cols-2">
            {items.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onEdit(c)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface-2"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 truncate text-sm text-fg">{c.name}</span>
                  <Pencil size={13} className="text-fg-subtle opacity-0 transition group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
