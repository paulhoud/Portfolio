import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedProjectPageView } from "@/components/pages/LocalizedProjectPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { projectMetadata } from "@/components/seo/pageMetadata";
import { creativeWorkSchema, projectBreadcrumbSchema } from "@/components/seo/schemas";
import { getProject, projects } from "@/content/projects";

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
  return projectMetadata(slug, "fr");
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <JsonLd schema={creativeWorkSchema(project, "fr")} />
      <JsonLd schema={projectBreadcrumbSchema(project, "fr")} />
      <LocalizedProjectPageView slug={slug} />
    </>
  );
}
