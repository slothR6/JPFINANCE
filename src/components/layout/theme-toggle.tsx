"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Escuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-hairline bg-surface p-0.5 shadow-xs">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition",
            theme === value ? "bg-surface-2 text-fg" : "text-fg-subtle hover:text-fg",
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
