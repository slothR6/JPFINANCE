import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy") {
  return format(typeof date === "string" ? new Date(`${date}T12:00:00`) : date, pattern, {
    locale: ptBR,
  });
}

export function formatMonthLabel(date: Date) {
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatMonthShort(date: Date) {
  return format(date, "MMM/yy", { locale: ptBR });
}

export function formatPercentage(value: number) {
  return `${value.toFixed(0)}%`;
}

