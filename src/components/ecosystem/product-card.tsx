import { ArrowUpRight, Download } from "lucide-react";
import { EcosystemActionLink } from "@/components/ecosystem/action-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getEcosystemStatusTone, type EcosystemProduct } from "@/content/ecosystem";

export function EcosystemProductCard({ product }: { product: EcosystemProduct }) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                {product.category}
              </p>
              <Badge tone={getEcosystemStatusTone(product.status)}>{product.statusLabel}</Badge>
            </div>
            <h2 className="text-lg font-semibold text-fg">{product.name}</h2>
            <p className="max-w-2xl text-sm leading-6 text-fg-muted">{product.summary}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            <EcosystemActionLink action={product.primaryAction} iconLeft={<Download size={15} />} />
            {product.secondaryAction ? (
              <EcosystemActionLink
                action={product.secondaryAction}
                variant="secondary"
                iconRight={<ArrowUpRight size={15} />}
              />
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
