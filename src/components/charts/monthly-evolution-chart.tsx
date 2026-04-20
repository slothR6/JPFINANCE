"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { EvolutionChartItem } from "@/types";

export function MonthlyEvolutionChart({
  data,
  title = "Evolução mensal",
}: {
  data: EvolutionChartItem[];
  title?: string;
}) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tendência dos últimos meses para enxergar melhora, aperto ou sazonalidade.
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
            <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `R$ ${value / 1000}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Area type="monotone" dataKey="income" name="Receitas" stroke="#0f766e" fill="url(#incomeFill)" />
            <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#f97316" fill="url(#expenseFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

