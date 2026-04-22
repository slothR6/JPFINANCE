"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.group === "main").slice(0, 4);
  const settings = NAV_ITEMS.find((i) => i.href === "/configuracoes")!;
  const visible = [...items, settings];
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
