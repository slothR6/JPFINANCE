"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { CategoryChartItem } from "@/types";

export function CategoryDonutChart({
  data,
  title = "Saídas por categoria",
}: {
  data: CategoryChartItem[];
  title?: string;
}) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Distribuição das despesas do mês para identificar onde o dinheiro está concentrado.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

