import { Download, LayoutTemplate, PenSquare, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

export type EcosystemStatus = "available" | "beta" | "coming-soon";
export type EcosystemActionMode = "internal" | "direct";

export interface EcosystemAction {
  label: string;
  href: string;
  mode: EcosystemActionMode;
  external?: boolean;
  downloadFileName?: string;
}

export interface EcosystemBenefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface EcosystemPlatform {
  name: string;
  statusLabel: string;
  tone: BadgeTone;
  description: string;
  action?: EcosystemAction;
}

export interface EcosystemProduct {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  status: EcosystemStatus;
  statusLabel: string;
  statusNote: string;
  primaryAction: EcosystemAction;
  secondaryAction?: EcosystemAction;
  benefits: EcosystemBenefit[];
  distributionTitle: string;
  distributionDescription: string;
  platforms: EcosystemPlatform[];
}

export const ecosystemProducts: EcosystemProduct[] = [
  {
    slug: "jp-finance",
    name: "JP Finance",
    category: "Finanças pessoais",
    summary: "Controle financeiro completo com receitas, despesas, contas a pagar e relatórios mensais.",
    description:
      "O JP Finance é o hub central do ecossistema JP. Organize suas finanças pessoais com clareza, acompanhe receitas e despesas, gerencie contas a pagar e tome decisões com base em dados reais do seu mês.",
    status: "available",
    statusLabel: "Disponível",
    statusNote: "Versão web disponível. Acesso direto pelo navegador, sem instalação.",
    primaryAction: {
      label: "Abrir app",
      href: "/dashboard",
      mode: "internal",
    },
    secondaryAction: {
      label: "Saiba mais",
      href: "/ecossistema/jp-finance",
      mode: "internal",
    },
    benefits: [
      {
        title: "Controle mensal",
        description: "Acompanhe receitas, despesas e saldo projetado mês a mês com clareza.",
        icon: TrendingUp,
      },
      {
        title: "Contas a pagar",
        description: "Gerencie vencimentos e evite atrasos com visibilidade completa de pendências.",
        icon: LayoutTemplate,
      },
      {
        title: "Relatórios visuais",
        description: "Gráficos de tendência e categorias para entender onde o dinheiro vai.",
        icon: Sparkles,
      },
    ],
    distributionTitle: "JP Finance — Acesso direto",
    distributionDescription:
      "O JP Finance está disponível como aplicação web. Acesse pelo navegador sem instalação.",
    platforms: [
      {
        name: "Web",
        statusLabel: "Disponível",
        tone: "success",
        description: "Acesse pelo navegador em qualquer dispositivo. Sem instalação necessária.",
        action: {
          label: "Abrir JP Finance",
          href: "/dashboard",
          mode: "internal",
        },
      },
    ],
  },
  {
    slug: "jp-note",
    name: "JP Note",
    category: "Captura e organização",
    summary: "Notas rápidas, organizadas e prontas para virar execução no seu fluxo de trabalho.",
    description:
      "O JP Note foi pensado para capturar ideias, organizar contexto e manter tudo acessível sem transformar o processo em burocracia.",
    status: "beta",
    statusLabel: "Beta",
    statusNote: "Canal oficial de distribuição dentro do JPFINANCE.",
    primaryAction: {
      label: "Baixar app",
      href: "/ecossistema/jp-note/download",
      mode: "internal",
    },
    secondaryAction: {
      label: "Saiba mais",
      href: "/ecossistema/jp-note",
      mode: "internal",
    },
    benefits: [
      {
        title: "Captura imediata",
        description: "Registre ideias e tarefas em segundos, sem perder contexto no caminho.",
        icon: PenSquare,
      },
      {
        title: "Estrutura leve",
        description: "Organize notas, blocos e referências com clareza, sem inflar o fluxo.",
        icon: LayoutTemplate,
      },
      {
        title: "Distribuição centralizada",
        description: "Use o JPFINANCE como hub único para descoberta, acesso e publicação de builds.",
        icon: Download,
      },
    ],
    distributionTitle: "Canal oficial do JP Note",
    distributionDescription:
      "A distribuição do JP Note fica centralizada aqui dentro do JPFINANCE, com espaço para link direto de instalador ou página interna por plataforma.",
    platforms: [
      {
        name: "Windows",
        statusLabel: "Canal principal",
        tone: "brand",
        description: "A publicação do instalador .exe pode acontecer por este canal sem mudar a experiência da interface.",
      },
      {
        name: "macOS",
        statusLabel: "Em breve",
        tone: "neutral",
        description: "A estrutura já considera a inclusão futura de uma distribuição .dmg no mesmo fluxo.",
      },
    ],
  },
];

export const featuredEcosystemProduct = ecosystemProducts[0];

export function getEcosystemProduct(slug: string) {
  return ecosystemProducts.find((product) => product.slug === slug);
}

export function getEcosystemStatusTone(status: EcosystemStatus): BadgeTone {
  switch (status) {
    case "available":
      return "success";
    case "beta":
      return "warning";
    case "coming-soon":
      return "info";
    default:
      return "neutral";
  }
}

export function countDistributionChannels() {
  return ecosystemProducts.reduce((total, product) => total + product.platforms.length, 0);
}
