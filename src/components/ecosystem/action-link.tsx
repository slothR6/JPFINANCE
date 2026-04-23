import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EcosystemAction } from "@/content/ecosystem";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-fg/90 focus-visible:ring-fg/20",
  secondary:
    "border border-hairline bg-surface text-fg hover:bg-surface-2 focus-visible:ring-fg/10",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:ring-fg/10",
};

interface Props {
  action: EcosystemAction;
  variant?: Variant;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function EcosystemActionLink({
  action,
  variant = "primary",
  className,
  iconLeft,
  iconRight,
}: Props) {
  const styles = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    variants[variant],
    className,
  );

  const content = (
    <>
      {iconLeft}
      {action.label}
      {iconRight}
    </>
  );

  if (action.mode === "internal") {
    return (
      <Link href={action.href} className={styles}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={action.href}
      className={styles}
      target={action.external ? "_blank" : undefined}
      rel={action.external ? "noreferrer" : undefined}
      download={action.external ? undefined : action.downloadFileName ?? true}
    >
      {content}
    </a>
  );
}
