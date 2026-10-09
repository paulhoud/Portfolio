"use client";

import { GalleryHome } from "@/components/gallery/GalleryHome";
import { getLocalizedProjects } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";
import { useScrollMemory } from "@/lib/useScrollMemory";

/**
 * Accueil : la galerie 3D, seule vue des projets. Sans 3D (navigateur qui ne
 * la permet pas), la même page montre la tuile du projet dans son cadre.
 */
export function HomePageView() {
  const { locale } = useTranslation();
  const projects = getLocalizedProjects(locale);

  // Revenir à l'accueil depuis une fiche projet reprend le défilement là où il
  // avait été laissé, donc devant le projet qu'on vient de lire.
  useScrollMemory("/");

  return <GalleryHome projects={projects} />;
}
