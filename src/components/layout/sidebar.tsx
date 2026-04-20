"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ChartColumn,
  CreditCard,
  Gauge,
  HandCoins,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/receitas", label: "Receitas", icon: TrendingUp },
  { href: "/despesas", label: "Despesas", icon: TrendingDown },
  { href: "/contas-a-pagar", label: "Contas a pagar", icon: CreditCard },
  { href: "/dividas", label: "Dívidas", icon: HandCoins },
  { href: "/relatorios", label: "Relatórios", icon: ChartColumn },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/75">
      <div>
        <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white dark:bg-slate-100 dark:text-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300 dark:text-teal-700">
            Finanças da casa
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold">Organização mensal</h2>
          <p className="mt-2 text-sm text-slate-300 dark:text-slate-700">
            Tudo compartilhado em um único lar financeiro.
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-teal-600 text-white shadow-md dark:bg-teal-500 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Dica prática
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100">
          Registre parcelas negociadas de dívidas manualmente como despesas mensais quando quiser que elas
          entrem no saldo do mês.
        </p>
      </div>
    </aside>
  );
}

