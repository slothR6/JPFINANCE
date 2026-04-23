import { ArrowLeft, Download, ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EcosystemActionLink } from "@/components/ecosystem/action-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getEcosystemProduct, getEcosystemStatusTone } from "@/content/ecosystem";

type Props = {
  params: Promise<{ slug: string }>;
};

const ecosystemBackAction = {
  label: "Voltar ao ecossistema",
  href: "/ecossistema",
  mode: "internal" as const,
};

export default async function EcosystemProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getEcosystemProduct(slug);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ecossistema JP"
        title={product.name}
        description={product.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <EcosystemActionLink action={product.primaryAction} iconLeft={<Download size={15} />} />
            <EcosystemActionLink
              action={ecosystemBackAction}
              variant="secondary"
              iconLeft={<ArrowLeft size={15} />}
            />
          </div>
        }
      />

      {/* Screenshot / mockup placeholder — substitua pela imagem real do app */}
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-hairline bg-surface-2/50">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-fg-subtle md:h-80">
          <ImageIcon size={28} strokeWidth={1.5} />
          <span className="text-sm">Screenshot do {product.name}</span>
          <span className="text-xs text-fg-subtle">Adicione a imagem em public/apps/{product.slug}.png</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--brand)/0.12),transparent_44%)]" />
            <CardBody className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Ecossistema JP</Badge>
                <Badge tone={getEcosystemStatusTone(product.status)}>{product.statusLabel}</Badge>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                  {product.category}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">
                  {product.summary}
                </h2>
                <p className="mt-3 text-sm leading-6 text-fg-muted">{product.description}</p>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {product.benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-hairline bg-surface/90 p-4 shadow-xs"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon size={17} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-fg">{benefit.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-fg-muted">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Disponibilidade</CardTitle>
            <CardSubtitle>{product.statusNote}</CardSubtitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              {product.platforms.map((platform) => (
                <div key={platform.name} className="rounded-2xl border border-hairline p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-fg">{platform.name}</h3>
                    <Badge tone={platform.tone}>{platform.statusLabel}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-fg-muted">{platform.description}</p>
                  {platform.action && (
                    <div className="mt-4">
                      <EcosystemActionLink action={platform.action} iconLeft={<Download size={15} />} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-hairline pt-4">
              <EcosystemActionLink action={product.primaryAction} iconLeft={<Download size={15} />} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
