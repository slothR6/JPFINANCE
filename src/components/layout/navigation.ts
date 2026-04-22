import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CalendarClock,
  Landmark,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "analytics" | "setup";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard, group: "main" },
  { href: "/receitas", label: "Receitas", icon: Wallet, group: "main" },
  { href: "/despesas", label: "Despesas", icon: Receipt, group: "main" },
  { href: "/contas-a-pagar", label: "Contas a pagar", icon: CalendarClock, group: "main" },
  { href: "/dividas", label: "Dívidas", icon: Landmark, group: "main" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, group: "analytics" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, group: "setup" },
];
