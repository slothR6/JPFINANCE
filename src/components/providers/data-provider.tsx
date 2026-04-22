"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  Bill,
  Category,
  CreditCard,
  Debt,
  DebtPayment,
  Expense,
  Income,
  UserPreferences,
} from "@/types";
import { COL, watchCollection, watchPreferences } from "@/services/repository";
import { useAuth } from "@/components/providers/auth-provider";

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  bills: Bill[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  creditCards: CreditCard[];
  preferences: UserPreferences | null;
  categoryById: (id: string) => Category | undefined;
  creditCardById: (id: string) => CreditCard | undefined;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [ready, setReady] = useState({ cat: false, inc: false, exp: false, bill: false, debt: false });

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setIncomes([]);
      setExpenses([]);
      setBills([]);
      setDebts([]);
      setDebtPayments([]);
      setCreditCards([]);
      setPreferences(null);
      return;
    }
    const uid = user.uid;
    const u1 = watchCollection<Category>(uid, COL.categories, (items) => {
      setCategories(items);
      setReady((r) => ({ ...r, cat: true }));
    });
    const u2 = watchCollection<Income>(uid, COL.incomes, (items) => {
      setIncomes(items);
      setReady((r) => ({ ...r, inc: true }));
    });
    const u3 = watchCollection<Expense>(uid, COL.expenses, (items) => {
      setExpenses(items);
      setReady((r) => ({ ...r, exp: true }));
    });
    const u4 = watchCollection<Bill>(uid, COL.bills, (items) => {
      setBills(items);
      setReady((r) => ({ ...r, bill: true }));
    });
    const u5 = watchCollection<Debt>(uid, COL.debts, (items) => {
      setDebts(items);
      setReady((r) => ({ ...r, debt: true }));
    });
    const u6 = watchCollection<DebtPayment>(uid, COL.debtPayments, setDebtPayments);
    const u7 = watchPreferences(uid, setPreferences);
    const u8 = watchCollection<CreditCard>(uid, COL.creditCards, setCreditCards);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
      u8();
    };
  }, [user]);

  const value = useMemo<DataContextValue>(() => {
    const loading = !!user && !(ready.cat && ready.inc && ready.exp && ready.bill && ready.debt);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const cardMap = new Map(creditCards.map((c) => [c.id, c]));
    return {
      loading,
      categories,
      incomes,
      expenses,
      bills,
      debts,
      debtPayments,
      creditCards,
      preferences,
      categoryById: (id: string) => catMap.get(id),
      creditCardById: (id: string) => cardMap.get(id),
    };
  }, [user, ready, categories, incomes, expenses, bills, debts, debtPayments, creditCards, preferences]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
