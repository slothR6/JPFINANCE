import { cn } from "@/lib/utils";

export function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      <div>{children}</div>
      <p className={cn("min-h-5 text-xs text-rose-500", !error && "opacity-0")}>{error || "ok"}</p>
    </label>
  );
}

