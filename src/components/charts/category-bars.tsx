"use client";

import type { Category, Expense } from "@/types";
import { aggregateByCategory } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  categories: Category[];
  limit?: number;
}

export function CategoryBars({ expenses, categories, limit = 6 }: Props) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const aggregated = aggregateByCategory(expenses)
    .map((a) => ({ ...a, category: catMap.get(a.categoryId) }))
    .filter((a) => a.category)
    .sort((a, b) => b.total - a.total);
  const total = aggregated.reduce((acc, a) => acc + a.total, 0);
  const top = aggregated.slice(0, limit);

  if (top.length === 0) {
    return <p className="text-xs text-fg-muted">Sem despesas para exibir.</p>;
  }

  return (
    <ul className="space-y-3.5">
      {top.map((a) => {
        const share = total > 0 ? a.total / total : 0;
        return (
          <li key={a.categoryId}>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-fg">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: a.category!.color }}
                />
                {a.category!.name}
              </span>
              <span className="tabular-nums font-medium text-fg">{formatCurrency(a.total)}</span>
            </div>
            <div className="mt-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${share * 100}%`, backgroundColor: a.category!.color }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
