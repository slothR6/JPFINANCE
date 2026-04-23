"use client";

import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NAV_ITEMS } from "./navigation";

export function Topbar() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const showMonthSwitcher = !pathname.startsWith("/ecossistema");

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-bg/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandLogo variant="mark" className="h-8 w-8 rounded-lg lg:hidden" sizes="32px" />
          <span className="truncate font-display text-sm font-semibold text-fg">
            {current?.label ?? "JPFINANCE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showMonthSwitcher ? <MonthSwitcher /> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
