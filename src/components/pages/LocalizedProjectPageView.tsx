"use client";

import { notFound } from "next/navigation";
import { ProjectBackdrop } from "@/components/projects/ProjectBackdrop";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { ProjectPager } from "@/components/projects/ProjectPager";
import { getLocalizedProject } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";

type LocalizedProjectPageViewProps = {
  slug: string;
};

export function LocalizedProjectPageView({ slug }: LocalizedProjectPageViewProps) {
  const { locale } = useTranslation();
  const project = getLocalizedProject(slug, locale);

  if (!project) {
    notFound();
  }

  // Fond uni porté ici (et non par l'article) : la grille s'y fond, du haut de
  // la page jusqu'aux projets voisins.
  return (
    <div className="relative isolate bg-page">
      <ProjectBackdrop mediaKey={project.mediaKey ?? ""} />
      <ProjectDetail project={project} />
      <ProjectPager slug={slug} />
    </div>
  );
}
