"use client";

import { usePathname } from "next/navigation";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { NAV_ITEMS } from "./navigation";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) => pathname.startsWith(i.href));
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-bg/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-semibold text-fg">
            {current?.label ?? "JPFINANCE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MonthSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
