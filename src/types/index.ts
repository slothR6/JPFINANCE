export type ResponsiblePerson = "eu" | "esposa" | "ambos" | "nao-definido";

export type ExpenseStatus = "pendente" | "pago";

export type ExpenseDisplayStatus = "pendente" | "pago" | "atrasado";

export type DebtStatus = "ativa" | "negociada" | "quitada";

export type FinancialHealth = "saudavel" | "atencao" | "estourado";

export interface BaseEntity {
  id: string;
  householdId: string;
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string | null;
}

export interface Income extends BaseEntity {
  description: string;
  amount: number;
  date: string;
  category: string;
  responsible?: ResponsiblePerson;
  isRecurring: boolean;
  recurrenceKey?: string | null;
  monthKey: string;
}

export interface Expense extends BaseEntity {
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  status: ExpenseStatus;
  isRecurring: boolean;
  recurrenceKey?: string | null;
  notes?: string;
  paidAt?: string | null;
  responsible?: ResponsiblePerson;
  monthKey: string;
}

export interface Debt extends BaseEntity {
  name: string;
  creditor: string;
  originalAmount: number;
  currentAmount: number;
  startDate: string;
  notes?: string;
  status: DebtStatus;
}

export interface DebtPayment extends BaseEntity {
  debtId: string;
  debtName: string;
  creditor: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

export interface Household {
  id: string;
  name: string;
  updatedAt: string;
}

export interface HouseholdSettings {
  id: string;
  householdId: string;
  householdName: string;
  monthlyBudget: number;
  alertThreshold: number;
  incomeCategories: string[];
  expenseCategories: string[];
  updatedAt: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  overdueExpenses: number;
  projectedBalance: number;
  debtBalance: number;
  paidDebtAmount: number;
  health: FinancialHealth;
}

export interface PaymentTimelineItem {
  id: string;
  type: "despesa" | "divida";
  description: string;
  amount: number;
  date: string;
}

export interface CategoryChartItem {
  name: string;
  value: number;
}

export interface EvolutionChartItem {
  monthKey: string;
  monthLabel: string;
  income: number;
  expenses: number;
}

