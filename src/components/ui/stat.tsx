import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; tone?: "positive" | "negative" | "neutral" };
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
}

export function Stat({ label, value, delta, icon, accent, className }: Props) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-xs transition hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg"
            style={accent ? { backgroundColor: `${accent}14`, color: accent } : undefined}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="font-display text-2xl font-semibold tracking-tight text-fg tabular-nums">
          {value}
        </div>
        {delta && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              delta.tone === "positive" && "text-success",
              delta.tone === "negative" && "text-danger",
              (!delta.tone || delta.tone === "neutral") && "text-fg-muted",
            )}
          >
            {delta.direction === "up" && <ArrowUpRight size={14} />}
            {delta.direction === "down" && <ArrowDownRight size={14} />}
            {delta.value}
          </div>
        )}
      </div>
    </div>
  );
}
