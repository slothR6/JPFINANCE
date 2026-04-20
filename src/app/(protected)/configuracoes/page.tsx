"use client";

import { SettingsForm } from "@/components/forms/settings-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useHouseholdData } from "@/hooks/use-household-data";
import { formatCurrency } from "@/lib/formatters";
import { saveSettings, seedSampleHouseholdData } from "@/services/household-service";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { householdId, settings, loading } = useHouseholdData();

  async function handleSave(values: {
    householdId: string;
    householdName: string;
    monthlyBudget: number;
    alertThreshold: number;
    incomeCategories: string[];
    expenseCategories: string[];
  }) {
    try {
      await saveSettings(householdId, {
        ...settings,
        ...values,
        id: "main",
        updatedAt: settings.updatedAt,
      });

      window.alert("Configurações salvas com sucesso.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
    }
  }

  async function handleSeed() {
    if (!window.confirm("Deseja popular a casa com dados fictícios? Use apenas em base vazia.")) {
      return;
    }

    try {
      await seedSampleHouseholdData(householdId, user?.email);
      window.alert("Dados fictícios inseridos com sucesso.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível inserir o seed.");
    }
  }

  if (loading) {
    return <LoadingScreen label="Carregando configurações..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ajustes"
        title="Configurações básicas"
        description="Defina o nome da casa, orçamento mensal, limite visual de alerta e as categorias que mais fazem sentido para o uso de vocês."
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-100">
              Parâmetros da casa
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              As alterações impactam todo o lar compartilhado.
            </p>
          </div>

          <SettingsForm settings={settings} onSubmit={handleSave} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
                Resumo da configuração atual
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dados principais usados para alertas visuais e organização das telas.
              </p>
            </div>

            <InfoRow label="Household ID" value={householdId} />
            <InfoRow label="Orçamento mensal" value={formatCurrency(settings.monthlyBudget)} />
            <InfoRow label="Alerta visual" value={`${settings.alertThreshold}% do orçamento`} />
            <InfoRow label="Categorias de receita" value={`${settings.incomeCategories.length} categorias`} />
            <InfoRow label="Categorias de despesa" value={`${settings.expenseCategories.length} categorias`} />
          </Card>

          <Card className="space-y-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
                Seed opcional para testes
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Insere receitas, despesas e uma dívida de exemplo. Ideal para testar rapidamente em uma base vazia.
              </p>
            </div>
            <Button variant="secondary" onClick={handleSeed}>
              Popular com dados fictícios
            </Button>
          </Card>

          <Card className="space-y-3">
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">
              Regras práticas desta aplicação
            </h3>
            <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              <li>Despesas recorrentes geram o próximo mês automaticamente quando o mês é acessado.</li>
              <li>Dívidas são controladas separadamente e não entram como despesa mensal por padrão.</li>
              <li>Pagamentos parciais de dívida reduzem o saldo atual automaticamente.</li>
              <li>O dashboard usa o mês selecionado como base para o resumo.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
