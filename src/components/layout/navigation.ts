import {
  Blocks,
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
  group: "main" | "analytics" | "ecosystem" | "setup";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Visao geral", icon: LayoutDashboard, group: "main" },
  { href: "/receitas", label: "Receitas", icon: Wallet, group: "main" },
  { href: "/despesas", label: "Despesas", icon: Receipt, group: "main" },
  { href: "/contas-a-pagar", label: "Contas a pagar", icon: CalendarClock, group: "main" },
  { href: "/dividas", label: "Dividas", icon: Landmark, group: "main" },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3, group: "analytics" },
  { href: "/ecossistema", label: "Ecossistema JP", icon: Blocks, group: "ecosystem" },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings, group: "setup" },
];
