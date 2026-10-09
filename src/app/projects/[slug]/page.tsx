import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedProjectPageView } from "@/components/pages/LocalizedProjectPageView";
import { JsonLd } from "@/components/seo/JsonLd";
import { creativeWorkSchema, projectBreadcrumbSchema } from "@/components/seo/schemas";
import { shareMetadata } from "@/components/seo/shareMetadata";
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
    title: `${project.title} - ${project.eyebrow}`,
    description: project.description,
    alternates: { canonical: url },
    ...shareMetadata({
      type: "article",
      title: `${project.title} - ${profile.name}`,
      description: project.description,
      url,
      // Générée par `opengraph-image.tsx`, dans ce même dossier.
      image: {
        url: `${url}/opengraph-image`,
        alt: `${project.title} - ${project.eyebrow}`,
      },
    }),
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
