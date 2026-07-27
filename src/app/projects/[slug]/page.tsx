import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedProjectPageView } from "@/components/pages/LocalizedProjectPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { creativeWorkSchema, projectBreadcrumbSchema } from "@/components/seo/schemas";
import { profile } from "@/content/profile";
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

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Projet introuvable" };
  }

  const url = `/projects/${project.slug}`;

  return {
    // Le nom est ajouté par le template défini dans le layout racine.
    title: `${project.title} — ${project.eyebrow}`,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${project.title} — ${profile.name}`,
      description: project.description,
      url,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <JsonLd schema={creativeWorkSchema(project)} />
      <JsonLd schema={projectBreadcrumbSchema(project)} />
      <LocalizedProjectPageView slug={slug} />
    </>
  );
}
