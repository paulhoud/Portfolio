import { renderProjectShareImage } from "@/components/seo/projectShareImage";
import { projects } from "@/content/projects";
import { getLocalizedProject } from "@/i18n/catalog";
import { locales, type Locale } from "@/i18n/types";

/**
 * Image de partage d'un projet, dans chaque langue (« /share-image/en/jive »),
 * générée au build comme les pages elles-mêmes (cf. projectShareImage).
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => projects.map((project) => ({ locale, slug: project.slug })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const project = locales.includes(locale as Locale) ? getLocalizedProject(slug, locale as Locale) : undefined;
  if (!project) return new Response("Introuvable", { status: 404 });
  return renderProjectShareImage(project);
}
