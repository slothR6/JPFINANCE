"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured, missingFirebaseEnv } from "@/lib/firebase/client";
import { loginWithEmail, logoutUser } from "@/services/auth-service";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  errorMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function syncAuthCookie(isAuthenticated: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (isAuthenticated) {
    document.cookie = "finance-auth=1; path=/; max-age=2592000; SameSite=Lax";
    return;
  }

  document.cookie = "finance-auth=; path=/; max-age=0; SameSite=Lax";
}

function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Email inválido.";
      case "auth/user-disabled":
        return "Usuário desativado no Firebase Authentication.";
      case "auth/user-not-found":
        return "Usuário não encontrado. Crie o usuário no Firebase Authentication.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou senha incorretos.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      case "auth/network-request-failed":
        return "Falha de rede ao contatar o Firebase. Verifique a conexão.";
      case "auth/operation-not-allowed":
        return "Método Email/Senha não está habilitado no Firebase Authentication.";
      case "auth/invalid-api-key":
      case "auth/api-key-not-valid":
        return "Chave de API do Firebase inválida. Revise NEXT_PUBLIC_FIREBASE_API_KEY.";
      case "auth/configuration-not-found":
        return "Configuração não encontrada. Habilite o provedor Email/Senha no console do Firebase.";
      default:
        return `Erro do Firebase (${error.code}): ${error.message}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Falha ao entrar.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setErrorMessage(
        `Firebase não configurado. Variáveis ausentes: ${missingFirebaseEnv.join(", ")}`,
      );
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      syncAuthCookie(Boolean(nextUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    setErrorMessage(null);

    try {
      await loginWithEmail(email, password);
      syncAuthCookie(true);
    } catch (error) {
      const message = mapAuthError(error);
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }

  async function logout() {
    setErrorMessage(null);
    await logoutUser();
    syncAuthCookie(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, errorMessage, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider.");
  }

  return context;
}
