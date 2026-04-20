import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildDateInMonth, getMonthKey, nowIso } from "@/lib/dates";
import { db } from "@/lib/firebase/client";
import type {
  Debt,
  DebtPayment,
  Expense,
  Household,
  HouseholdSettings,
  Income,
} from "@/types";

interface SaveIncomeInput {
  description: string;
  amount: number;
  date: string;
  category: string;
  responsible?: Income["responsible"];
  isRecurring: boolean;
  recurrenceKey?: string | null;
}

interface SaveExpenseInput {
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  notes?: string;
  status?: Expense["status"];
  paidAt?: string | null;
  responsible?: Expense["responsible"];
  isRecurring: boolean;
  recurrenceKey?: string | null;
}

interface SaveDebtInput {
  name: string;
  creditor: string;
  originalAmount: number;
  currentAmount: number;
  startDate: string;
  notes?: string;
  status: Debt["status"];
}

interface SaveDebtPaymentInput {
  debtId: string;
  debtName: string;
  creditor: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

function ensureDb() {
  if (!db) {
    throw new Error("Firebase não configurado. Ajuste o .env.local antes de usar a aplicação.");
  }

  return db;
}

function householdDoc(householdId: string) {
  return doc(ensureDb(), "households", householdId);
}

function settingsRef(householdId: string) {
  return doc(ensureDb(), "households", householdId, "settings", "main");
}

function incomeRef(householdId: string) {
  return collection(ensureDb(), "households", householdId, "income");
}

function expenseRef(householdId: string) {
  return collection(ensureDb(), "households", householdId, "expenses");
}

function debtRef(householdId: string) {
  return collection(ensureDb(), "households", householdId, "debts");
}

function debtPaymentRef(householdId: string) {
  return collection(ensureDb(), "households", householdId, "debtPayments");
}

function mapCollection<T extends { updatedAt?: string }>(
  snapshot: { docs: Array<{ data: () => DocumentData }> },
) {
  return snapshot.docs
    .map((docSnapshot) => docSnapshot.data() as T)
    .sort((first, second) => (second.updatedAt || "").localeCompare(first.updatedAt || ""));
}

function subscribeToCollection<T extends { updatedAt?: string }>(
  reference: CollectionReference<DocumentData>,
  onData: (items: T[]) => void,
) {
  return onSnapshot(reference, (snapshot) => {
    onData(mapCollection<T>(snapshot));
  });
}

export function subscribeToIncomes(householdId: string, onData: (items: Income[]) => void) {
  return subscribeToCollection<Income>(incomeRef(householdId), onData);
}

export function subscribeToExpenses(householdId: string, onData: (items: Expense[]) => void) {
  return subscribeToCollection<Expense>(expenseRef(householdId), onData);
}

export function subscribeToDebts(householdId: string, onData: (items: Debt[]) => void) {
  return subscribeToCollection<Debt>(debtRef(householdId), onData);
}

export function subscribeToDebtPayments(
  householdId: string,
  onData: (items: DebtPayment[]) => void,
) {
  return subscribeToCollection<DebtPayment>(debtPaymentRef(householdId), onData);
}

export function subscribeToSettings(
  householdId: string,
  onData: (settings: HouseholdSettings | null) => void,
) {
  return onSnapshot(settingsRef(householdId), (snapshot) => {
    onData(snapshot.exists() ? (snapshot.data() as HouseholdSettings) : null);
  });
}

export async function ensureHouseholdSetup(householdId: string) {
  const [householdSnapshot, settingsSnapshot] = await Promise.all([
    getDoc(householdDoc(householdId)),
    getDoc(settingsRef(householdId)),
  ]);
  const now = nowIso();

  if (!householdSnapshot.exists()) {
    const household: Household = {
      id: householdId,
      name: DEFAULT_SETTINGS.householdName,
      updatedAt: now,
    };

    await setDoc(householdDoc(householdId), household);
  }

  if (!settingsSnapshot.exists()) {
    await setDoc(settingsRef(householdId), {
      ...DEFAULT_SETTINGS,
      householdId,
      updatedAt: now,
    });
  }
}

export async function saveSettings(householdId: string, input: HouseholdSettings) {
  const payload: HouseholdSettings = {
    ...input,
    id: "main",
    householdId,
    updatedAt: nowIso(),
  };

  await Promise.all([
    setDoc(settingsRef(householdId), payload, { merge: true }),
    setDoc(
      householdDoc(householdId),
      {
        id: householdId,
        name: payload.householdName,
        updatedAt: payload.updatedAt,
      } satisfies Household,
      { merge: true },
    ),
  ]);
}

export async function addIncome(
  householdId: string,
  input: SaveIncomeInput,
  createdByEmail?: string | null,
) {
  const reference = doc(incomeRef(householdId));
  const now = nowIso();
  const payload: Income = {
    id: reference.id,
    householdId,
    description: input.description,
    amount: input.amount,
    date: input.date,
    category: input.category,
    responsible: input.responsible,
    isRecurring: input.isRecurring,
    recurrenceKey: input.isRecurring ? input.recurrenceKey || reference.id : null,
    monthKey: getMonthKey(input.date),
    createdByEmail: createdByEmail || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(reference, payload);
}

export async function updateIncome(householdId: string, id: string, input: SaveIncomeInput) {
  await updateDoc(doc(incomeRef(householdId), id), {
    description: input.description,
    amount: input.amount,
    date: input.date,
    category: input.category,
    responsible: input.responsible,
    isRecurring: input.isRecurring,
    recurrenceKey: input.isRecurring ? input.recurrenceKey || id : null,
    monthKey: getMonthKey(input.date),
    updatedAt: nowIso(),
  });
}

export async function deleteIncome(householdId: string, id: string) {
  await deleteDoc(doc(incomeRef(householdId), id));
}

export async function addExpense(
  householdId: string,
  input: SaveExpenseInput,
  createdByEmail?: string | null,
) {
  const reference = doc(expenseRef(householdId));
  const now = nowIso();
  const payload: Expense = {
    id: reference.id,
    householdId,
    description: input.description,
    amount: input.amount,
    category: input.category,
    dueDate: input.dueDate,
    notes: input.notes || "",
    status: input.status || "pendente",
    paidAt: input.status === "pago" ? input.paidAt || input.dueDate : null,
    responsible: input.responsible,
    isRecurring: input.isRecurring,
    recurrenceKey: input.isRecurring ? input.recurrenceKey || reference.id : null,
    monthKey: getMonthKey(input.dueDate),
    createdByEmail: createdByEmail || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(reference, payload);
}

export async function updateExpense(householdId: string, id: string, input: SaveExpenseInput) {
  await updateDoc(doc(expenseRef(householdId), id), {
    description: input.description,
    amount: input.amount,
    category: input.category,
    dueDate: input.dueDate,
    notes: input.notes || "",
    status: input.status || "pendente",
    paidAt: input.status === "pago" ? input.paidAt || input.dueDate : null,
    responsible: input.responsible,
    isRecurring: input.isRecurring,
    recurrenceKey: input.isRecurring ? input.recurrenceKey || id : null,
    monthKey: getMonthKey(input.dueDate),
    updatedAt: nowIso(),
  });
}

export async function deleteExpense(householdId: string, id: string) {
  await deleteDoc(doc(expenseRef(householdId), id));
}

export async function markExpenseAsPaid(
  householdId: string,
  id: string,
  paidAt = nowIso().slice(0, 10),
) {
  await updateDoc(doc(expenseRef(householdId), id), {
    status: "pago",
    paidAt,
    updatedAt: nowIso(),
  });
}

export async function markExpenseAsPending(householdId: string, id: string) {
  await updateDoc(doc(expenseRef(householdId), id), {
    status: "pendente",
    paidAt: null,
    updatedAt: nowIso(),
  });
}

export async function addDebt(
  householdId: string,
  input: SaveDebtInput,
  createdByEmail?: string | null,
) {
  const reference = doc(debtRef(householdId));
  const now = nowIso();
  const payload: Debt = {
    id: reference.id,
    householdId,
    name: input.name,
    creditor: input.creditor,
    originalAmount: input.originalAmount,
    currentAmount: input.currentAmount,
    startDate: input.startDate,
    notes: input.notes || "",
    status: input.status,
    createdByEmail: createdByEmail || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(reference, payload);
}

export async function updateDebt(householdId: string, id: string, input: SaveDebtInput) {
  await updateDoc(doc(debtRef(householdId), id), {
    name: input.name,
    creditor: input.creditor,
    originalAmount: input.originalAmount,
    currentAmount: input.currentAmount,
    startDate: input.startDate,
    notes: input.notes || "",
    status: input.status,
    updatedAt: nowIso(),
  });
}

export async function deleteDebt(householdId: string, id: string) {
  await deleteDoc(doc(debtRef(householdId), id));
}

export async function recordDebtPayment(
  householdId: string,
  input: SaveDebtPaymentInput,
  createdByEmail?: string | null,
) {
  const database = ensureDb();
  const debtDocument = doc(database, "households", householdId, "debts", input.debtId);
  const paymentDocument = doc(debtPaymentRef(householdId));

  await runTransaction(database, async (transaction) => {
    const debtSnapshot = await transaction.get(debtDocument);

    if (!debtSnapshot.exists()) {
      throw new Error("Dívida não encontrada.");
    }

    const debt = debtSnapshot.data() as Debt;
    const newBalance = Math.max(0, debt.currentAmount - input.amount);
    const nextStatus: Debt["status"] = newBalance <= 0 ? "quitada" : debt.status;
    const now = nowIso();
    const payment: DebtPayment = {
      id: paymentDocument.id,
      householdId,
      debtId: input.debtId,
      debtName: input.debtName,
      creditor: input.creditor,
      amount: input.amount,
      paymentDate: input.paymentDate,
      notes: input.notes || "",
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(paymentDocument, payment);
    transaction.update(debtDocument, {
      currentAmount: newBalance,
      status: nextStatus,
      updatedAt: now,
    });
  });
}

export async function ensureRecurringIncomeForMonth(
  householdId: string,
  targetMonthKey: string,
  incomes: Income[],
) {
  const recurringSources = incomes.filter((income) => income.isRecurring);

  for (const source of recurringSources) {
    const recurrenceKey = source.recurrenceKey || source.id;
    const family = recurringSources
      .filter((item) => (item.recurrenceKey || item.id) === recurrenceKey)
      .sort((first, second) => first.monthKey.localeCompare(second.monthKey));

    if (family.some((item) => item.monthKey === targetMonthKey)) {
      continue;
    }

    const latest = family.filter((item) => item.monthKey < targetMonthKey).at(-1);

    if (!latest) {
      continue;
    }

    const reference = doc(incomeRef(householdId));
    const now = nowIso();
    const payload: Income = {
      ...latest,
      id: reference.id,
      date: buildDateInMonth(targetMonthKey, latest.date),
      monthKey: targetMonthKey,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(reference, payload);
  }
}

export async function ensureRecurringExpenseForMonth(
  householdId: string,
  targetMonthKey: string,
  expenses: Expense[],
) {
  const recurringSources = expenses.filter((expense) => expense.isRecurring);

  for (const source of recurringSources) {
    const recurrenceKey = source.recurrenceKey || source.id;
    const family = recurringSources
      .filter((item) => (item.recurrenceKey || item.id) === recurrenceKey)
      .sort((first, second) => first.monthKey.localeCompare(second.monthKey));

    if (family.some((item) => item.monthKey === targetMonthKey)) {
      continue;
    }

    const latest = family.filter((item) => item.monthKey < targetMonthKey).at(-1);

    if (!latest) {
      continue;
    }

    const reference = doc(expenseRef(householdId));
    const now = nowIso();
    const payload: Expense = {
      ...latest,
      id: reference.id,
      dueDate: buildDateInMonth(targetMonthKey, latest.dueDate),
      status: "pendente",
      paidAt: null,
      monthKey: targetMonthKey,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(reference, payload);
  }
}

export async function seedSampleHouseholdData(householdId: string, createdByEmail?: string | null) {
  const database = ensureDb();
  const [incomeSnapshot, expenseSnapshot, debtSnapshot] = await Promise.all([
    getDocs(incomeRef(householdId)),
    getDocs(expenseRef(householdId)),
    getDocs(debtRef(householdId)),
  ]);

  if (!incomeSnapshot.empty || !expenseSnapshot.empty || !debtSnapshot.empty) {
    throw new Error("A base já possui dados. Use o seed apenas em uma casa vazia.");
  }

  const batch = writeBatch(database);
  const now = nowIso();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const referenceMonth = `${year}-${month}`;
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`;

  const incomes: Array<Omit<Income, "id">> = [
    {
      householdId,
      description: "Salário Pedro",
      amount: 4200,
      date: `${referenceMonth}-05`,
      category: "Salário",
      responsible: "eu",
      isRecurring: true,
      recurrenceKey: "salario-pedro",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Salário esposa",
      amount: 3600,
      date: `${referenceMonth}-07`,
      category: "Salário",
      responsible: "esposa",
      isRecurring: true,
      recurrenceKey: "salario-esposa",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Projeto freelance",
      amount: 850,
      date: `${referenceMonth}-12`,
      category: "Freelance",
      responsible: "eu",
      isRecurring: false,
      recurrenceKey: null,
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const expenses: Array<Omit<Expense, "id">> = [
    {
      householdId,
      description: "Aluguel",
      amount: 1600,
      category: "Moradia",
      dueDate: `${referenceMonth}-10`,
      status: "pendente",
      isRecurring: true,
      recurrenceKey: "aluguel",
      notes: "",
      paidAt: null,
      responsible: "ambos",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Energia",
      amount: 210,
      category: "Contas fixas",
      dueDate: `${referenceMonth}-14`,
      status: "pago",
      isRecurring: true,
      recurrenceKey: "energia",
      notes: "",
      paidAt: `${referenceMonth}-13`,
      responsible: "ambos",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Supermercado semanal",
      amount: 420,
      category: "Mercado",
      dueDate: `${referenceMonth}-08`,
      status: "pago",
      isRecurring: false,
      recurrenceKey: null,
      notes: "Compra principal do mês",
      paidAt: `${referenceMonth}-08`,
      responsible: "ambos",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Internet",
      amount: 120,
      category: "Contas fixas",
      dueDate: `${referenceMonth}-18`,
      status: "pendente",
      isRecurring: true,
      recurrenceKey: "internet",
      notes: "",
      paidAt: null,
      responsible: "ambos",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
    {
      householdId,
      description: "Plano de saúde",
      amount: 520,
      category: "Saúde",
      dueDate: `${referenceMonth}-04`,
      status: "pendente",
      isRecurring: true,
      recurrenceKey: "plano-saude",
      notes: "Exemplo de conta atrasada",
      paidAt: null,
      responsible: "ambos",
      monthKey: referenceMonth,
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const debts: Array<Omit<Debt, "id">> = [
    {
      householdId,
      name: "Cartão renegociado",
      creditor: "Banco Exemplo",
      originalAmount: 6500,
      currentAmount: 4200,
      startDate: `${previousMonth}-03`,
      notes: "Negociação em 12 parcelas",
      status: "negociada",
      createdByEmail: createdByEmail || null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  incomes.forEach((income) => {
    const reference = doc(incomeRef(householdId));
    batch.set(reference, {
      ...income,
      id: reference.id,
    } satisfies Income);
  });

  expenses.forEach((expense) => {
    const reference = doc(expenseRef(householdId));
    batch.set(reference, {
      ...expense,
      id: reference.id,
    } satisfies Expense);
  });

  debts.forEach((debt) => {
    const reference = doc(debtRef(householdId));
    batch.set(reference, {
      ...debt,
      id: reference.id,
    } satisfies Debt);
  });

  await batch.commit();
}
