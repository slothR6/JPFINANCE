import type { Category } from "@/types";

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Salário", kind: "income", color: "#059669", order: 0 },
  { name: "Freelance", kind: "income", color: "#0891b2", order: 1 },
  { name: "Rendimentos", kind: "income", color: "#7c3aed", order: 2 },
  { name: "Outros", kind: "income", color: "#64748b", order: 3 },
  { name: "Moradia", kind: "expense", color: "#ef4444", order: 0 },
  { name: "Alimentação", kind: "expense", color: "#f59e0b", order: 1 },
  { name: "Transporte", kind: "expense", color: "#3b82f6", order: 2 },
  { name: "Saúde", kind: "expense", color: "#10b981", order: 3 },
  { name: "Educação", kind: "expense", color: "#8b5cf6", order: 4 },
  { name: "Lazer", kind: "expense", color: "#ec4899", order: 5 },
  { name: "Assinaturas", kind: "expense", color: "#06b6d4", order: 6 },
  { name: "Outros", kind: "expense", color: "#64748b", order: 7 },
];

export const CATEGORY_COLORS = [
  "#059669",
  "#0891b2",
  "#7c3aed",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
  "#f43f5e",
  "#14b8a6",
  "#eab308",
];

export const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "outros", label: "Outros" },
] as const;
