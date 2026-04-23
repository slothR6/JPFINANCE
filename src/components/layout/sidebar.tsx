"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { cn, initialsFromName } from "@/lib/utils";
import { NAV_ITEMS } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const main = NAV_ITEMS.filter((item) => item.group === "main");
  const analytics = NAV_ITEMS.filter((item) => item.group === "analytics");
  const ecosystem = NAV_ITEMS.filter((item) => item.group === "ecosystem");
  const setup = NAV_ITEMS.filter((item) => item.group === "setup");

  const name = user?.displayName || user?.email || "Voce";
  const initials = initialsFromName(user?.displayName || user?.email || "");

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 border-b border-hairline px-5 py-4 transition hover:bg-surface-2/50"
        aria-label="JPFINANCE - Dashboard"
      >
        <BrandLogo variant="mark" className="h-10 w-10 rounded-xl" sizes="40px" />
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold text-fg">JPFINANCE</div>
          <div className="text-2xs text-fg-subtle">seu controle pessoal</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavGroup label="Navegacao" items={main} pathname={pathname} />
        <NavGroup label="Analise" items={analytics} pathname={pathname} />
        {ecosystem.length > 0 ? (
          <NavGroup label="Ecossistema" items={ecosystem} pathname={pathname} />
        ) : null}
        <NavGroup label="Conta" items={setup} pathname={pathname} />
      </nav>

      <div className="border-t border-hairline p-3">
        <div className="group flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-fg">{name}</div>
            <div className="truncate text-2xs text-fg-subtle">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 rounded-md p-1.5 text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: typeof NAV_ITEMS;
  pathname: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-surface-2 text-fg"
                    : "text-fg-muted hover:bg-surface-2/70 hover:text-fg",
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "transition",
                    active ? "text-brand" : "text-fg-subtle group-hover:text-fg-muted",
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
