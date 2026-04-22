import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, children, className, htmlFor }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-fg-muted">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-2xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-2xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function FieldRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h4>
        {description && <p className="text-xs text-fg-muted">{description}</p>}
      </header>
      {children}
    </section>
  );
}
