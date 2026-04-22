import { BrandLogo } from "@/components/branding/brand-logo";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-2 bg-gradient-to-r from-surface-2 via-border/60 to-surface-2 bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <BrandLogo variant="mark" className="h-12 w-12 rounded-2xl" sizes="48px" />
        <div className="h-6 w-6 rounded-full border-2 border-hairline border-t-brand animate-spin" />
        <p className="text-xs text-fg-muted">Carregando…</p>
      </div>
    </div>
  );
}
