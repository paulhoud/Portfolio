"use client";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { getLocalizedProjects } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";

export function HomePageView() {
  const { locale, t } = useTranslation();
  const projects = getLocalizedProjects(locale);

  return (
    <>
      <h1 className="sr-only">{t.site.meta.title}</h1>
      <ProjectGrid projects={projects} />
    </>
  );
}
