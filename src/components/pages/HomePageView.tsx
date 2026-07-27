"use client";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { profile } from "@/content/profile";
import { getLocalizedProjects } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";

export function HomePageView() {
  const { locale } = useTranslation();
  const projects = getLocalizedProjects(locale);

  return (
    <>
      {/* Titre principal du site : associe explicitement le nom au métier.
          Masqué visuellement pour préserver le damier plein écran. */}
      <h1 className="sr-only">
        {profile.name} — {profile.jobTitle}
      </h1>
      <ProjectGrid projects={projects} />
    </>
  );
}
