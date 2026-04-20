export function LoadingScreen({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500 dark:border-slate-700 dark:border-t-teal-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

