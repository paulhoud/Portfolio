"use client";

import { AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useTranslation } from "@/i18n/context";
import { isHomePath } from "@/i18n/paths";
import { applyTheme, useTheme } from "@/lib/theme";
import { SceneCursor } from "@/components/gallery/SceneCursor";
import { Analytics } from "@/components/stats/Analytics";
import { FixedBackButton } from "./FixedBackButton";
import { Opening } from "./Opening";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { Veil } from "./Veil";

/**
 * Cadre applicatif persistant. Rend la chrome (header, bouton retour fixe,
 * retour-en-haut, pied de page) EN DEHORS de la zone animée, de sorte qu'elle
 * reste stable pendant les transitions de page, tandis que seul le contenu
 * (`PageTransition`) glisse. Remplace l'ancien `SiteShell` répété page par page.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = isHomePath(pathname);
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [theme] = useTheme();

  // Accueil : le défilement s'arrête sur chaque projet (cf. globals.css).
  useEffect(() => {
    document.documentElement.classList.toggle("home-snap", isHome);
    return () => document.documentElement.classList.remove("home-snap");
  }, [isHome]);

  // Thème clair ou sombre, appliqué avant la peinture.
  useLayoutEffect(() => applyTheme(theme), [theme]);

  return (
    // framer-motion suit le réglage système « réduire les animations ».
    <MotionConfig reducedMotion="user">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:text-black"
      >
        {t.site.nav.skipToContent}
      </a>

      <SiteHeader />
      <Analytics />

      <AnimatePresence>{!isHome ? <FixedBackButton key="back" /> : null}</AnimatePresence>

      <main id="contenu" tabIndex={-1} className="portfolio-main focus:outline-none">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Sur l'accueil, la mention de droits flotte sur la galerie (cf. GalleryHome). */}
      {!isHome ? <SiteFooter /> : null}

      <ScrollToTop />

      <Veil />

      {/* Le même curseur sur toutes les pages ; l'accueil lui dit ce que survole la scène. */}
      <SceneCursor calm={Boolean(reducedMotion)} />

      {/* Rideau d'ouverture, hors de la zone animée pour couvrir aussi l'en-tête. */}
      <Opening />
    </MotionConfig>
  );
}
