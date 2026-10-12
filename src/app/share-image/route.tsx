import { renderSiteShareImage } from "@/components/seo/siteShareImage";

/**
 * Image de partage du site (Open Graph, Twitter Card), générée au build, à une
 * adresse fixe déclarée par toutes les pages via `shareMetadata`. Une image
 * `opengraph-image` rangée dans un groupe de routes (app/(fr), app/(en))
 * recevrait une adresse à suffixe aléatoire, que les métadonnées ne pourraient
 * pas citer.
 */
export const dynamic = "force-static";

export function GET() {
  return renderSiteShareImage();
}
