"use client";

import { Menu, MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/providers/theme-provider";
import { useHouseholdData } from "@/hooks/use-household-data";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, householdId } = useHouseholdData();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-slate-200/80 bg-white/90 px-5 py-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/75">
      <div className="flex items-center gap-3">
        <Button variant="secondary" className="lg:hidden" onClick={onOpenMenu}>
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
            {settings.householdName}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">householdId: {householdId}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={toggleTheme} className="gap-2">
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </Button>
        <div className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:block">
          {user?.email}
        </div>
        <Button variant="ghost" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  );
}

