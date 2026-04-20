import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <div className="space-y-3 text-center">
        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mx-auto max-w-xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
        {action}
      </div>
    </Card>
  );
}

