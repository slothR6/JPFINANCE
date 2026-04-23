import { ArrowLeft, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { EcosystemActionLink } from "@/components/ecosystem/action-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getEcosystemProduct, getEcosystemStatusTone } from "@/content/ecosystem";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EcosystemDownloadPage({ params }: Props) {
  const { slug } = await params;
  const product = getEcosystemProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ecossistema JP"
        title={`Download do ${product.name}`}
        description={product.distributionDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            {product.secondaryAction ? (
              <EcosystemActionLink
                action={product.secondaryAction}
                variant="secondary"
                iconLeft={<ArrowLeft size={15} />}
              />
            ) : null}
            <EcosystemActionLink
              action={{ label: "Voltar ao ecossistema", href: "/ecossistema", mode: "internal" }}
              variant="ghost"
            />
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--brand)/0.18),transparent_44%)]" />
          <CardBody className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">Canal oficial</Badge>
              <Badge tone={getEcosystemStatusTone(product.status)}>{product.statusLabel}</Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-fg">
                {product.distributionTitle}
              </h2>
              <p className="text-sm leading-6 text-fg-muted">{product.distributionDescription}</p>
            </div>

            <div className="rounded-2xl border border-dashed border-hairline bg-surface/90 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                <Download size={16} className="text-brand" />
                Distribuicao preparada por plataforma
              </div>
              <p className="mt-2 text-xs leading-5 text-fg-muted">
                As builds do JP Note podem ser liberadas aqui por instalador direto ou por link externo,
                mantendo a mesma experiencia para o usuario final.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opcoes de download</CardTitle>
            <CardSubtitle>Status atual por plataforma</CardSubtitle>
          </CardHeader>
          <CardBody className="grid gap-3">
            {product.platforms.map((platform) => (
              <div
                key={platform.name}
                className="rounded-2xl border border-hairline bg-surface-2/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">{platform.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-fg-muted">{platform.description}</p>
                  </div>
                  <Badge tone={platform.tone}>{platform.statusLabel}</Badge>
                </div>

                {platform.action ? (
                  <div className="mt-4">
                    <EcosystemActionLink action={platform.action} iconLeft={<Download size={15} />} />
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-fg-subtle">
                    Este canal ja esta pronto para receber o link oficial da build quando a publicacao for liberada.
                  </p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
