import { cn } from "@/lib/utils";

export function Progress({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const toneClass =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-danger"
          : "bg-fg";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div className={cn("h-full rounded-full transition-all", toneClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}
