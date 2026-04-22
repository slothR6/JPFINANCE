import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: Props) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="text-2xs font-medium uppercase tracking-[0.14em] text-fg-subtle">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
