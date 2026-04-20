import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { FinancialHealth } from "@/types";

export function StatCard({
  title,
  value,
  helper,
  tone = "neutral",
  health,
}: {
  title: string;
  value: number;
  helper: string;
  tone?: "neutral" | "positive" | "negative";
  health?: FinancialHealth;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-slate-50">
            {formatCurrency(value)}
          </p>
        </div>
        {health ? (
          <StatusPill status={health} />
        ) : (
          <div
            className={cn(
              "rounded-2xl p-2",
              tone === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
              tone === "negative" && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
              tone === "neutral" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {tone === "positive" ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : tone === "negative" ? (
              <ArrowDownRight className="h-5 w-5" />
            ) : (
              <Minus className="h-5 w-5" />
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">{helper}</p>
    </Card>
  );
}

