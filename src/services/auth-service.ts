import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, missingFirebaseEnv } from "@/lib/firebase/client";

function ensureAuth() {
  if (!auth) {
    const faltando = missingFirebaseEnv.join(", ");
    throw new Error(
      faltando
        ? `Firebase não configurado. Variáveis ausentes: ${faltando}.`
        : "Firebase não foi inicializado. Verifique as variáveis NEXT_PUBLIC_FIREBASE_* no .env.local.",
    );
  }

  return auth;
}

export async function loginWithEmail(email: string, password: string) {
  const authInstance = ensureAuth();

  await setPersistence(authInstance, browserLocalPersistence);
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function logoutUser() {
  const authInstance = ensureAuth();
  return signOut(authInstance);
}
