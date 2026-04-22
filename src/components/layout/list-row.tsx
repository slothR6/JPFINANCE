"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Props {
  dot?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  tags?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ dot, title, subtitle, right, tags, onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-2/50",
        className,
      )}
    >
      {dot !== undefined && (
        <span
          className="inline-block h-8 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: dot || "#cbd5e1" }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-2xs text-fg-muted">
          {subtitle && <span>{subtitle}</span>}
          {tags}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {right}
        <ChevronRight size={16} className="text-fg-subtle opacity-0 transition group-hover:opacity-100" />
      </div>
    </button>
  );
}
