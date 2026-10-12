"use client";

import { notFound } from "next/navigation";
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

  return (
    <>
      <ProjectDetail project={project} />
      <ProjectPager slug={slug} />
    </>
  );
}
