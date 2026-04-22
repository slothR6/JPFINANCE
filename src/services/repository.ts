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
import { auth, db } from "@/lib/firebase";
import { logDevError, permissionError } from "@/lib/errors";
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

export const COL = {
  incomes: "incomes",
  expenses: "expenses",
  bills: "bills",
  debts: "debts",
  debtPayments: "debtPayments",
  categories: "categories",
  creditCards: "creditCards",
} as const;

function isKnownUserCollection(name: string) {
  return Object.values(COL).includes(name as (typeof COL)[keyof typeof COL]);
}

function assertKnownUserCollection(name: string) {
  if (!isKnownUserCollection(name)) {
    throw permissionError(`Blocked Firestore access to unknown collection: ${name}`);
  }
}

function isCurrentUser(uid: string) {
  return auth().currentUser?.uid === uid;
}

function assertCurrentUser(uid: string) {
  if (!isCurrentUser(uid)) {
    throw permissionError("Blocked Firestore access for a different user.");
  }
}

function userCol(uid: string, name: string) {
  assertKnownUserCollection(name);
  return collection(db(), "users", uid, name);
}

function userDoc(uid: string, name: string, id: string) {
  assertKnownUserCollection(name);
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
  if (!isCurrentUser(uid)) {
    logDevError("Blocked Firestore listener for a different user.", { uid });
    onData([]);
    return () => undefined;
  }

  const ref = orderField
    ? query(userCol(uid, name), orderBy(orderField, "desc"))
    : query(userCol(uid, name));
  return onSnapshot(
    ref,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(items);
    },
    (err) => {
      logDevError(`Firestore listener failed for ${name}.`, err);
      onData([]);
    },
  );
}

export async function createItem<T extends object>(uid: string, name: string, data: T): Promise<string> {
  assertCurrentUser(uid);
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
  assertCurrentUser(uid);
  await updateDoc(userDoc(uid, name, id), stripUndefined(data as Record<string, unknown>));
}

export async function deleteItem(uid: string, name: string, id: string) {
  assertCurrentUser(uid);
  await deleteDoc(userDoc(uid, name, id));
}

const PREFS_DOC = "meta/preferences";

export async function readPreferences(uid: string): Promise<UserPreferences | null> {
  assertCurrentUser(uid);
  const ref = doc(db(), "users", uid, "meta", "preferences");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserPreferences) : null;
}

export function watchPreferences(uid: string, onData: (p: UserPreferences | null) => void) {
  if (!isCurrentUser(uid)) {
    logDevError("Blocked preferences listener for a different user.", { uid });
    onData(null);
    return () => undefined;
  }

  const ref = doc(db(), "users", uid, "meta", "preferences");
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? (snap.data() as UserPreferences) : null),
    (err) => {
      logDevError("Firestore preferences listener failed.", err);
      onData(null);
    },
  );
}

export async function savePreferences(uid: string, data: UserPreferences) {
  assertCurrentUser(uid);
  const ref = doc(db(), "users", uid, "meta", "preferences");
  await setDoc(ref, stripUndefined(data as unknown as Record<string, unknown>), { merge: true });
}

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
