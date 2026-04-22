import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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

function userCol(uid: string, name: string) {
  return collection(db(), "users", uid, name);
}

function userDoc(uid: string, name: string, id: string) {
  return doc(db(), "users", uid, name, id);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function watchCollection<T>(
  uid: string,
  name: string,
  onData: (items: T[]) => void,
  orderField?: string,
): () => void {
  const ref = orderField
    ? query(userCol(uid, name), orderBy(orderField, "desc"))
    : query(userCol(uid, name));
  return onSnapshot(
    ref,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(items);
    },
    () => onData([]),
  );
}

export async function createItem<T extends object>(uid: string, name: string, data: T): Promise<string> {
  const payload = stripUndefined({ ...data, createdAt: serverTimestamp() });
  const ref = await addDoc(userCol(uid, name), payload as Record<string, unknown>);
  return ref.id;
}

export async function updateItem<T extends object>(
  uid: string,
  name: string,
  id: string,
  data: Partial<T>,
) {
  await updateDoc(userDoc(uid, name, id), stripUndefined(data as Record<string, unknown>));
}

export async function deleteItem(uid: string, name: string, id: string) {
  await deleteDoc(userDoc(uid, name, id));
}

const PREFS_DOC = "meta/preferences";

export async function readPreferences(uid: string): Promise<UserPreferences | null> {
  const ref = doc(db(), "users", uid, "meta", "preferences");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserPreferences) : null;
}

export function watchPreferences(uid: string, onData: (p: UserPreferences | null) => void) {
  const ref = doc(db(), "users", uid, "meta", "preferences");
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? (snap.data() as UserPreferences) : null),
    () => onData(null),
  );
}

export async function savePreferences(uid: string, data: UserPreferences) {
  const ref = doc(db(), "users", uid, "meta", "preferences");
  await setDoc(ref, stripUndefined(data as unknown as Record<string, unknown>), { merge: true });
}

export const COL = {
  incomes: "incomes",
  expenses: "expenses",
  bills: "bills",
  debts: "debts",
  debtPayments: "debtPayments",
  categories: "categories",
  creditCards: "creditCards",
} as const;

export type {
  Category,
  CreditCard,
  Income,
  Expense,
  Bill,
  Debt,
  DebtPayment,
  UserPreferences,
};
export { PREFS_DOC };
