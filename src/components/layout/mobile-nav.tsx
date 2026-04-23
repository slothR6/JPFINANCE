"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navigation";

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.group === "main").slice(0, 4);
  const ecosystem = NAV_ITEMS.find((item) => item.href === "/ecossistema");
  const settings = NAV_ITEMS.find((item) => item.href === "/configuracoes")!;
  const tail = pathname.startsWith("/ecossistema") && ecosystem ? ecosystem : settings;
  const visible = [...items, tail];

  return (
    <nav className="sticky bottom-0 z-30 border-t border-hairline bg-surface/90 backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {visible.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-2xs font-medium transition",
                  active ? "text-fg" : "text-fg-subtle",
                )}
              >
                <Icon size={18} className={active ? "text-brand" : undefined} />
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
