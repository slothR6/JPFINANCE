"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { logDevError } from "@/lib/errors";
import { safeInternalPath } from "@/lib/safe-redirect";

const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Informe seu nome"),
});

type Mode = "signin" | "signup";

export function LoginScreen() {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const nextPath = safeInternalPath(params.get("next"));

  const form = useForm<{ email: string; password: string; name?: string }>({
    resolver: zodResolver(mode === "signin" ? signInSchema : signUpSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  useEffect(() => {
    form.reset({ email: form.getValues("email"), password: "", name: "" });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, user, router, nextPath]);

  const onSubmit = form.handleSubmit(async (values) => {
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(values.email, values.password);
      } else {
        await signUp(values.email, values.password, values.name || "");
        toast({ tone: "success", title: "Conta criada", description: "Bem-vindo ao JPFINANCE." });
      }
      router.replace(nextPath);
    } catch (err) {
      logDevError("Firebase sign-in failed", err);
      const message = humanFirebaseError(err);
      toast({ tone: "error", title: "Não foi possível entrar", description: message });
    } finally {
      setBusy(false);
    }
  });

  const onGoogleSignIn = async () => {
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      router.replace(nextPath);
    } catch (err) {
      logDevError("Firebase Google sign-in failed", err);
      const message = humanFirebaseError(err);
      toast({ tone: "error", title: "Não foi possível entrar com Google", description: message });
    } finally {
      setGoogleBusy(false);
    }
  };

  const onReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({ tone: "info", title: "Informe seu e-mail", description: "Preencha o campo primeiro." });
      return;
    }
    try {
      await resetPassword(email);
      toast({ tone: "success", title: "E-mail enviado", description: "Verifique sua caixa de entrada." });
    } catch (err) {
      logDevError("Firebase password reset failed", err);
      toast({ tone: "error", title: "Falhou", description: humanFirebaseError(err) });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg px-6 py-10">
      <div className="absolute inset-0 -z-10 opacity-40" aria-hidden>
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-info/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandLogo priority className="h-32 w-72 max-w-full sm:h-36 sm:w-80" />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-hairline bg-surface p-7 shadow-soft sm:p-8">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-2 p-0.5">
            <TabButton active={mode === "signin"} onClick={() => setMode("signin")}>
              Entrar
            </TabButton>
            <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
              Criar conta
            </TabButton>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googleBusy}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-hairline bg-surface-2/60 px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-surface-2 disabled:opacity-60"
          >
            <GoogleIcon />
            {googleBusy ? "Aguarde..." : "Continuar com Google"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-2xs text-fg-subtle">ou</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Nome" error={form.formState.errors.name?.message}>
                <Input
                  autoComplete="name"
                  placeholder="Como devemos te chamar?"
                  {...form.register("name")}
                />
              </Field>
            )}

            <Field label="E-mail" error={form.formState.errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                {...form.register("email")}
              />
            </Field>

            <Field label="Senha" error={form.formState.errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {mode === "signin" && (
              <button
                type="button"
                onClick={onReset}
                className="block text-xs font-medium text-fg-muted transition hover:text-fg"
              >
                Esqueci minha senha
              </button>
            )}

            <Button type="submit" size="lg" loading={busy} className="w-full" iconRight={<ArrowRight size={16} />}>
              {mode === "signin" ? "Entrar" : "Criar minha conta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition " +
        (active ? "bg-surface text-fg shadow-xs" : "text-fg-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function humanFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "E-mail ou senha incorretos.";
  if (code.includes("email-already-in-use")) return "Este e-mail já está em uso.";
  if (code.includes("weak-password")) return "Senha muito fraca.";
  if (code.includes("too-many-requests")) return "Muitas tentativas. Tente novamente em instantes.";
  if (code.includes("network")) return "Sem conexão com a internet.";
  if (code.includes("popup-closed")) return "Login cancelado.";
  if (code.includes("account-exists-with-different-credential"))
    return "Este e-mail já está associado a outro método de login.";
  return "Tente novamente em instantes.";
}
