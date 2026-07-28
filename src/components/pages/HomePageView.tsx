"use client";

import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { profile } from "@/content/profile";
import { getLocalizedProjects } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";
import { useScrollMemory } from "@/lib/useScrollMemory";

export function HomePageView() {
  const { locale } = useTranslation();
  const projects = getLocalizedProjects(locale);

  // Revenir au damier depuis une fiche projet reprend le défilement là où il
  // avait été laissé, plutôt que de tout remonter en haut.
  useScrollMemory("/");

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
