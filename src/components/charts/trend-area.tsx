"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { Expense, Income } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { parseISO } from "@/lib/dates";

interface Props {
  incomes: Income[];
  expenses: Expense[];
  months?: number;
  referenceDate?: Date;
  expenseDate?: (expense: Expense) => string;
}

export function TrendArea({ incomes, expenses, months = 6, referenceDate, expenseDate }: Props) {
  const now = referenceDate ?? new Date();
  const buckets: { key: string; label: string; incomes: number; expenses: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: format(d, "MMM", { locale: ptBR }),
      incomes: 0,
      expenses: 0,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));

  for (const i of incomes) {
    try {
      const d = parseISO(i.receivedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const k = idx.get(key);
      if (k !== undefined) buckets[k].incomes += i.amount;
    } catch {}
  }
  for (const e of expenses) {
    try {
      const d = parseISO(expenseDate?.(e) ?? e.paidAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const k = idx.get(key);
      if (k !== undefined) buckets[k].expenses += e.amount;
    } catch {}
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={buckets} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.24} />
            <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--hairline))" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--fg-subtle))", fontSize: 11 }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--fg-subtle))", fontSize: 11 }}
          tickFormatter={(v) => (v === 0 ? "" : formatCurrency(v as number, { compact: true }))}
          width={58}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--hairline))" }}
          formatter={(v: number, k: string) => [formatCurrency(v), k === "incomes" ? "Receitas" : "Despesas"]}
          labelFormatter={(l) => `Mês: ${l}`}
        />
        <Area
          type="monotone"
          dataKey="incomes"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          fill="url(#gInc)"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(var(--danger))"
          strokeWidth={2}
          fill="url(#gExp)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
