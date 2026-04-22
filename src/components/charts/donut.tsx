"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Slice {
  name: string;
  value: number;
  color: string;
}

export function Donut({ data, total, label }: { data: Slice[]; total: number; label?: string }) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-fg-muted">
        Sem dados
      </div>
    );
  }
  return (
    <div className="relative h-[220px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xs uppercase tracking-wide text-fg-subtle">{label ?? "Total"}</span>
        <span className="font-display text-base font-semibold text-fg tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
