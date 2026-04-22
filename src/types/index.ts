export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon?: string;
  order?: number;
  archived?: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  receivedAt: string; // ISO date (yyyy-MM-dd)
  recurring?: boolean;
  recurringBaseId?: string;
  recurringOccurrence?: boolean;
  note?: string;
  createdAt?: string;
}

// "despesa" = regular/fixed expense (groceries, gas, subscriptions)
// "gasto"   = day-to-day discretionary spending (lunch, coffee, entertainment)
export type ExpenseKind = "despesa" | "gasto";
export type ExpensePaymentStatus = "pending" | "paid";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  paidAt: string; // ISO date for the expense date / due date
  paymentStatus?: ExpensePaymentStatus;
  paidOn?: string; // ISO date when the obligation was settled
  expenseKind?: ExpenseKind;
  recurring?: boolean;
  recurringBaseId?: string;
  recurringOccurrence?: boolean;
  method?: "pix" | "cartao" | "dinheiro" | "boleto" | "transferencia" | "outros";
  creditCardId?: string;
  creditCardDueAt?: string; // ISO date - computed billing due date
  note?: string;
  createdAt?: string;
}

export type BillStatus = "pending" | "paid" | "overdue";

export interface Bill {
  id: string;
  description: string;
  amount: number;
  categoryId?: string;
  dueAt: string; // ISO date
  paidAt?: string; // ISO date
  status: BillStatus;
  note?: string;
  createdAt?: string;
}

// "negociada" = debt with known installments/terms (e.g. car financing)
// "mapeada"   = debt you want to track but haven't negotiated yet
export type DebtKind = "negociada" | "mapeada";

export interface Debt {
  id: string;
  name: string;
  creditor?: string;
  debtKind: DebtKind;
  totalAmount: number;
  // Only required for "negociada" debts:
  installments?: number;
  paidInstallments?: number;
  installmentAmount?: number;
  firstDueAt?: string; // ISO date
  interestRate?: number;
  note?: string;
  archived?: boolean;
  createdAt?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paidAt: string; // ISO date
  installmentNumber?: number;
  note?: string;
  createdAt?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  lastDigits?: string;
  closingDay: number; // day of month statement closes (1-28)
  dueDay: number;     // day of month payment is due (1-28)
  limit?: number;
  color?: string;
  archived?: boolean;
  createdAt?: string;
}

export interface UserPreferences {
  displayName?: string;
  currency: string; // "BRL"
  monthlyBudget?: number;
  savingsGoal?: number;
  theme?: "light" | "dark" | "system";
}
