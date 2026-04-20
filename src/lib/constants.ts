import type { HouseholdSettings, ResponsiblePerson } from "@/types";

export const DEFAULT_HOUSEHOLD_ID =
  process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID || "casa-pedro";

export const RESPONSIBLE_OPTIONS: ResponsiblePerson[] = [
  "nao-definido",
  "eu",
  "esposa",
  "ambos",
];

export const DEFAULT_SETTINGS: HouseholdSettings = {
  id: "main",
  householdId: DEFAULT_HOUSEHOLD_ID,
  householdName: "Casa Pedro",
  monthlyBudget: 4500,
  alertThreshold: 85,
  incomeCategories: [
    "Salário",
    "Freelance",
    "Extra",
    "Reembolso",
    "Investimentos",
  ],
  expenseCategories: [
    "Moradia",
    "Mercado",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Assinaturas",
    "Contas fixas",
  ],
  updatedAt: new Date().toISOString(),
};

export const EXPENSE_FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pendente", label: "Pendentes" },
  { id: "pago", label: "Pagas" },
  { id: "atrasado", label: "Atrasadas" },
] as const;

export const BILL_FILTERS = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "atrasadas", label: "Atrasadas" },
  { id: "pendentes", label: "Pendentes" },
  { id: "pagas", label: "Pagas" },
] as const;

export const CHART_COLORS = ["#0f766e", "#14b8a6", "#f59e0b", "#f97316", "#2563eb"];
