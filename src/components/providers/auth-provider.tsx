"use client";

import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { createItem, COL, savePreferences } from "@/services/repository";

const SESSION_COOKIE = "jpf-session";

function setSessionCookie(value: string | null) {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
  }
}

async function seedNewUser(uid: string, displayName?: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((c) => createItem(uid, COL.categories, c)),
  );
  await savePreferences(uid, {
    displayName: displayName || undefined,
    currency: "BRL",
    theme: "system",
  });
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), (u) => {
      setUser(u);
      setSessionCookie(u ? u.uid : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth(), email, password);
    setSessionCookie(cred.user.uid);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth(), email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    setSessionCookie(cred.user.uid);
    await seedNewUser(cred.user.uid, name);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth(), provider);
    setSessionCookie(cred.user.uid);
    const info = getAdditionalUserInfo(cred);
    if (info?.isNewUser) {
      await seedNewUser(cred.user.uid, cred.user.displayName ?? undefined);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth());
    setSessionCookie(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth(), email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
