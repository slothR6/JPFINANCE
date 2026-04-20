"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export function IncomeVsExpenseChart({
  income,
  expenses,
  title = "Entradas x saídas",
}: {
  income: number;
  expenses: number;
  title?: string;
}) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Comparação direta do que entrou e do que saiu no período selecionado.
        </p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              { name: "Mês atual", entradas: income, saidas: expenses },
            ]}
            barCategoryGap={48}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${value / 1000}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="entradas" fill="#0f766e" radius={[10, 10, 0, 0]} />
            <Bar dataKey="saidas" fill="#f97316" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

