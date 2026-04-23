"use client";

import { useEffect, useState } from "react";
import {
  BarChart2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Sparkles,
    iconBg: "bg-brand/10 text-brand",
    title: "Bem-vindo(a) ao JPFinance",
    description:
      "Seu controle financeiro pessoal, simples e completo. Vamos mostrar como tudo funciona — vai levar menos de 2 minutos.",
    highlight: null,
  },
  {
    icon: LayoutDashboard,
    iconBg: "bg-brand/10 text-brand",
    title: "Visão geral do mês",
    description:
      "O painel principal mostra seu saldo, total de receitas, despesas, contas a pagar e status do orçamento — tudo do mês selecionado, em tempo real. Use o seletor de mês para navegar no tempo.",
    highlight: null,
  },
  {
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10 text-emerald-500",
    title: "Registre suas receitas",
    description:
      "Salário, freelances, rendimentos — qualquer entrada de dinheiro vai aqui. Ative a opção Recorrente e o sistema lança automaticamente todo mês, sem precisar repetir o cadastro.",
    highlight: null,
  },
  {
    icon: ShoppingBag,
    iconBg: "bg-amber-500/10 text-amber-500",
    title: "Controle seus gastos",
    description:
      "Registre compras, contas fixas e qualquer saída de dinheiro. Despesas como aluguel e assinaturas podem ser marcadas como recorrentes para aparecer todo mês automaticamente.",
    highlight: null,
  },
  {
    icon: CreditCard,
    iconBg: "bg-sky-500/10 text-sky-500",
    title: "Cartões e faturas automáticas",
    description:
      "Ao lançar uma despesa, selecione o cartão como forma de pagamento. O sistema calcula automaticamente em qual fatura aquela compra vai cair — sem contas na mão.",
    highlight:
      "Antes de usar, cadastre seu cartão em Configurações informando o dia de fechamento e o dia de vencimento da fatura.",
  },
  {
    icon: Receipt,
    iconBg: "bg-red-500/10 text-red-500",
    title: "Contas a pagar e dívidas",
    description:
      "Contas a Pagar são compromissos com vencimento futuro, como conta de luz ou IPTU. Dívidas são financiamentos e empréstimos — o sistema acompanha parcelas pagas e saldo devedor.",
    highlight: null,
  },
  {
    icon: BarChart2,
    iconBg: "bg-violet-500/10 text-violet-500",
    title: "Calendário e relatórios",
    description:
      "O Calendário mostra todas as movimentações organizadas por data, facilitando ver dias de maior gasto. Em Relatórios você encontra análises detalhadas por categoria, tendências e comparativos de períodos.",
    highlight: null,
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10 text-emerald-500",
    title: "Tudo pronto para começar!",
    description:
      "Agora é só registrar suas finanças e acompanhar seu dinheiro de perto. Você pode rever este tutorial a qualquer momento em Configurações → \"Ver tutorial novamente\".",
    highlight: null,
  },
] as const;

interface Props {
  open: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

export function OnboardingModal({ open, onFinish, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnimKey((k) => k + 1);
    }
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const goTo = (next: number) => {
    setStep(next);
    setAnimKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={isLast ? onFinish : onSkip}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-surface shadow-pop">
        {/* Skip (X) button */}
        {!isLast && (
          <button
            onClick={onSkip}
            aria-label="Pular tutorial"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} />
          </button>
        )}

        {/* Body */}
        <div key={animKey} className="animate-fade-in p-6 pb-5">
          {/* Step dots */}
          <div className="mb-6 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step
                    ? "w-5 bg-brand"
                    : i < step
                      ? "w-1.5 bg-brand/30"
                      : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            className={cn(
              "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
              current.iconBg,
            )}
          >
            <Icon size={22} />
          </div>

          {/* Step label */}
          <p className="mb-1 text-xs font-medium text-fg-subtle">
            Etapa {step + 1} de {STEPS.length}
          </p>

          {/* Title */}
          <h2 className="mb-3 text-xl font-bold leading-tight text-fg">
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-sm leading-relaxed text-fg-muted">
            {current.description}
          </p>

          {/* Highlight box */}
          {current.highlight && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3">
              <p className="mb-0.5 text-xs font-semibold text-brand">
                Dica importante
              </p>
              <p className="text-xs leading-relaxed text-brand/70">
                {current.highlight}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-4">
          <div>
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<ChevronLeft size={14} />}
                onClick={() => goTo(step - 1)}
              >
                Voltar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Pular
              </Button>
            )}
            <Button
              size="sm"
              iconRight={!isLast ? <ChevronRight size={14} /> : undefined}
              onClick={isLast ? onFinish : () => goTo(step + 1)}
            >
              {isLast ? "Começar agora!" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
