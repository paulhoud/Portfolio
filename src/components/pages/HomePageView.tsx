"use client";

import { GalleryHome } from "@/components/gallery/GalleryHome";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { profile } from "@/content/profile";
import { getLocalizedProjects } from "@/i18n/catalog";
import { useTranslation } from "@/i18n/context";
import { setHomeView, useHomeView } from "@/lib/homeView";
import { useScrollMemory } from "@/lib/useScrollMemory";
import { useEffect } from "react";

export function HomePageView() {
  const { locale, t } = useTranslation();
  const projects = getLocalizedProjects(locale);
  const view = useHomeView();

  // Une fois la galerie affichée, le masquage d'avant affichage n'a plus
  // lieu d'être (sinon la grille resterait cachée si l'on y revient). Pas
  // avant : pendant l'hydratation, c'est encore la grille qui est rendue.
  useEffect(() => {
    if (view === "gallery") document.documentElement.removeAttribute("data-home-view");
  }, [view]);

  // Revenir au damier depuis une fiche projet reprend le défilement là où il
  // avait été laissé, plutôt que de tout remonter en haut.
  useScrollMemory("/");

  if (view === "gallery") return <GalleryHome projects={projects} />;

  return (
    <div className="home-grid">
      {/* Titre principal du site : associe explicitement le nom au métier.
          Masqué visuellement pour préserver le damier plein écran. */}
      <h1 className="sr-only">
        {profile.name} — {profile.jobTitle}
      </h1>
      <ProjectGrid projects={projects} />

      {/* Exploration : bascule vers l'accueil en galerie (choix mémorisé). */}
      <button
        type="button"
        onClick={() => {
          setHomeView("gallery");
          window.scrollTo({ top: 0 });
        }}
        className="fixed bottom-6 left-6 z-40 flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-5 text-[0.68rem] uppercase tracking-[0.14em] text-white/85 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      >
        {t.site.gallery.showGallery}
      </button>
    </div>
  );
}
