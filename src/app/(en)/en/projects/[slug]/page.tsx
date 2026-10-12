import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedProjectPageView } from "@/components/pages/LocalizedProjectPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { projectMetadata } from "@/components/seo/pageMetadata";
import { creativeWorkSchema, projectBreadcrumbSchema } from "@/components/seo/schemas";
import { projects } from "@/content/projects";
import { getLocalizedProject } from "@/i18n/catalog";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  return projectMetadata(slug, "en");
}

/** Page projet en anglais : le même récit, ses textes traduits. */
export default async function EnglishProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getLocalizedProject(slug, "en");

  if (!project) {
    notFound();
  }

  return (
    <>
      <JsonLd schema={creativeWorkSchema(project, "en")} />
      <JsonLd schema={projectBreadcrumbSchema(project, "en")} />
      <LocalizedProjectPageView slug={slug} />
    </>
  );
}
