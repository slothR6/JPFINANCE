"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_HOUSEHOLD_ID, DEFAULT_SETTINGS } from "@/lib/constants";
import type { Debt, DebtPayment, Expense, HouseholdSettings, Income } from "@/types";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  ensureHouseholdSetup,
  ensureRecurringExpenseForMonth,
  ensureRecurringIncomeForMonth,
  subscribeToDebtPayments,
  subscribeToDebts,
  subscribeToExpenses,
  subscribeToIncomes,
  subscribeToSettings,
} from "@/services/household-service";

interface HouseholdDataContextValue {
  householdId: string;
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  settings: HouseholdSettings;
  loading: boolean;
  ensureRecurringForMonth: (monthKey: string) => Promise<void>;
}

const HouseholdDataContext = createContext<HouseholdDataContextValue | undefined>(undefined);

export function HouseholdDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [settings, setSettings] = useState<HouseholdSettings>({
    ...DEFAULT_SETTINGS,
    householdId: DEFAULT_HOUSEHOLD_ID,
  });
  const [loading, setLoading] = useState(true);
  const syncedMonthsRef = useRef(new Set<string>());

  useEffect(() => {
    syncedMonthsRef.current.clear();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setIncomes([]);
      setExpenses([]);
      setDebts([]);
      setDebtPayments([]);
      return;
    }

    setLoading(true);
    let isMounted = true;
    const pendingSnapshots = new Set(["settings", "incomes", "expenses", "debts", "debtPayments"]);

    function markReady(key: string) {
      pendingSnapshots.delete(key);

      if (isMounted && pendingSnapshots.size === 0) {
        setLoading(false);
      }
    }

    ensureHouseholdSetup(DEFAULT_HOUSEHOLD_ID)
      .catch((error) => {
        console.error(error);
      });

    const unsubscribeSettings = subscribeToSettings(DEFAULT_HOUSEHOLD_ID, (nextSettings) => {
      if (nextSettings) {
        setSettings(nextSettings);
      }

      markReady("settings");
    });
    const unsubscribeIncomes = subscribeToIncomes(DEFAULT_HOUSEHOLD_ID, (items) => {
      setIncomes(items);
      markReady("incomes");
    });
    const unsubscribeExpenses = subscribeToExpenses(DEFAULT_HOUSEHOLD_ID, (items) => {
      setExpenses(items);
      markReady("expenses");
    });
    const unsubscribeDebts = subscribeToDebts(DEFAULT_HOUSEHOLD_ID, (items) => {
      setDebts(items);
      markReady("debts");
    });
    const unsubscribeDebtPayments = subscribeToDebtPayments(DEFAULT_HOUSEHOLD_ID, (items) => {
      setDebtPayments(items);
      markReady("debtPayments");
    });

    return () => {
      isMounted = false;
      unsubscribeSettings();
      unsubscribeIncomes();
      unsubscribeExpenses();
      unsubscribeDebts();
      unsubscribeDebtPayments();
    };
  }, [user]);

  async function ensureRecurringForMonth(monthKey: string) {
    if (!user || loading || !monthKey || syncedMonthsRef.current.has(monthKey)) {
      return;
    }

    syncedMonthsRef.current.add(monthKey);

    try {
      await Promise.all([
        ensureRecurringIncomeForMonth(DEFAULT_HOUSEHOLD_ID, monthKey, incomes),
        ensureRecurringExpenseForMonth(DEFAULT_HOUSEHOLD_ID, monthKey, expenses),
      ]);
    } catch (error) {
      syncedMonthsRef.current.delete(monthKey);
      throw error;
    }
  }

  return (
    <HouseholdDataContext.Provider
      value={{
        householdId: DEFAULT_HOUSEHOLD_ID,
        incomes,
        expenses,
        debts,
        debtPayments,
        settings,
        loading,
        ensureRecurringForMonth,
      }}
    >
      {children}
    </HouseholdDataContext.Provider>
  );
}

export function useHouseholdDataContext() {
  const context = useContext(HouseholdDataContext);

  if (!context) {
    throw new Error("useHouseholdDataContext deve ser usado dentro de HouseholdDataProvider.");
  }

  return context;
}
