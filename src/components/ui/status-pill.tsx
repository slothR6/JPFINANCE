import { Badge } from "@/components/ui/badge";
import type { DebtStatus, ExpenseDisplayStatus, FinancialHealth } from "@/types";

type StatusValue = ExpenseDisplayStatus | DebtStatus | FinancialHealth;

const styles: Record<StatusValue, string> = {
  pendente: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  pago: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  atrasado: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  ativa: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  negociada: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  quitada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  saudavel: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  atencao: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  estourado: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
};

export function StatusPill({ status }: { status: StatusValue }) {
  return <Badge className={styles[status]}>{status}</Badge>;
}

