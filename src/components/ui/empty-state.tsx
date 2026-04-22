import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-hairline bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      {icon && <div className="text-fg-subtle">{icon}</div>}
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="text-xs text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
