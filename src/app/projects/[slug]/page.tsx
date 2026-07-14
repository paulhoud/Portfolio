import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedProjectPageView } from "@/components/pages/LocalizedProjectPageView";
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
    return {
      title: "Projet introuvable - Paul Houdebine",
    };
  }

  return {
    title: `${project.title} - Paul Houdebine`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  if (!getProject(slug)) {
    notFound();
  }

  return <LocalizedProjectPageView slug={slug} />;
}
