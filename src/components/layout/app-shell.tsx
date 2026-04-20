"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mesh-light px-4 py-4 dark:bg-mesh-dark md:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[290px_1fr]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/55 p-4 backdrop-blur-sm lg:hidden">
            <div className="h-full max-w-sm">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex min-h-0 flex-col gap-4">
          <Topbar onOpenMenu={() => setMobileMenuOpen(true)} />
          <div className="flex-1 rounded-[36px] border border-white/60 bg-white/45 p-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/35 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
