import { ArrowUpRight, Download } from "lucide-react";
import { EcosystemActionLink } from "@/components/ecosystem/action-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { featuredEcosystemProduct, getEcosystemStatusTone } from "@/content/ecosystem";

const ecosystemHubAction = {
  label: "Ver Ecossistema JP",
  href: "/ecossistema",
  mode: "internal" as const,
};

export function EcosystemSpotlight() {
  const product = featuredEcosystemProduct;

  return (
    <Card className="relative overflow-hidden border-brand/20 bg-[radial-gradient(circle_at_top_left,hsl(var(--brand)/0.2),transparent_42%)]">
      <CardBody className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="brand">Ecossistema JP</Badge>
            <Badge tone={getEcosystemStatusTone(product.status)}>{product.statusLabel}</Badge>
          </div>

          <div className="max-w-2xl space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Novo canal de distribuicao
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
              {product.name} agora tem espaco proprio dentro do JPFINANCE.
            </h2>
            <p className="text-sm leading-6 text-fg-muted">{product.summary}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {product.benefits.map((benefit) => (
              <span
                key={benefit.title}
                className="rounded-full border border-hairline bg-surface/90 px-3 py-1 text-xs font-medium text-fg-muted"
              >
                {benefit.title}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <EcosystemActionLink action={product.primaryAction} iconLeft={<Download size={15} />} />
          <EcosystemActionLink
            action={ecosystemHubAction}
            variant="secondary"
            iconRight={<ArrowUpRight size={15} />}
          />
        </div>
      </CardBody>
    </Card>
  );
}
