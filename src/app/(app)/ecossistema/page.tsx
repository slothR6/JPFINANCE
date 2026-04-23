import { countDistributionChannels, ecosystemProducts } from "@/content/ecosystem";
import { EcosystemProductCard } from "@/components/ecosystem/product-card";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function EcosystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ecossistema JP"
        title="Apps e ferramentas"
        description="Um ponto único para descobrir, acessar e baixar os aplicativos da marca JP."
      />

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--brand)/0.16),transparent_46%)]" />
        <CardBody className="relative space-y-5">
          <div className="max-w-3xl space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Hub de distribuição
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
              Um ponto único para apresentar e entregar os apps da marca JP.
            </h2>
            <p className="text-sm leading-6 text-fg-muted">
              Descubra, acesse e baixe os aplicativos do ecossistema JP diretamente por aqui,
              com a mesma identidade visual do JPFINANCE.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <HubMetric value={String(ecosystemProducts.length)} label="Apps publicados" />
            <HubMetric value={String(countDistributionChannels())} label="Canais preparados" />
            <HubMetric value="Ativo" label="Status do ecossistema" />
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-fg">Aplicativos publicados</h2>
        <div className="space-y-4">
          {ecosystemProducts.map((product) => (
            <EcosystemProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HubMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface/90 px-4 py-3 shadow-xs">
      <div className="text-lg font-semibold text-fg">{value}</div>
      <div className="mt-0.5 text-xs text-fg-muted">{label}</div>
    </div>
  );
}
