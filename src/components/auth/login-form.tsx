"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

const loginSchema = z.object({
  email: z.string().email("Digite um email válido."),
  password: z.string().min(6, "Digite a senha com ao menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, errorMessage } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);

    try {
      await login(values.email, values.password);
      router.replace(redirectTarget);
    } catch {
      // AuthProvider already expõe a mensagem amigável para a tela.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_34%),linear-gradient(160deg,#020617_10%,#0f172a_55%,#134e4a_100%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
            <Home className="h-4 w-4 text-teal-300" />
            Lar compartilhado para duas pessoas
          </div>
          <div className="mt-10 max-w-xl space-y-6">
            <h1 className="font-display text-5xl font-bold leading-tight">
              Controle o mês com clareza, sem transformar a casa em uma planilha confusa.
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              Receitas, despesas, contas a pagar e dívidas no mesmo lugar, com dados compartilhados e
              visão prática do que venceu, do que ainda falta pagar e do que já apertou o orçamento.
            </p>
          </div>
        </div>
        <div className="relative grid gap-4 md:grid-cols-3">
          {[
            "Saldo previsto do mês em destaque",
            "Dívidas separadas das despesas comuns",
            "Visão clara de hoje, semana e mês",
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm leading-6 text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-mesh-light px-4 py-10 dark:bg-mesh-dark">
        <Card className="w-full max-w-md rounded-[32px] p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              Acesso ao sistema
            </p>
            <h2 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Entrar no lar financeiro
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Use um usuário criado manualmente no Firebase Authentication. Ambos os usuários acessam a
              mesma casa e os mesmos dados.
            </p>
          </div>

          <form className="mt-8 space-y-2" onSubmit={handleSubmit(onSubmit)}>
            <FormField label="Email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="voce@email.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register("email")}
                />
              </div>
            </FormField>

            <FormField label="Senha" error={errors.password?.message}>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Sua senha"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register("password")}
                />
              </div>
            </FormField>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" className="mt-4 w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
