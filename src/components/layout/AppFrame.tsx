"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { useTranslation } from "@/i18n/context";
import { useMotionPaused } from "@/lib/motionPause";
import { applyTheme, useTheme } from "@/lib/theme";
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
  const isHome = pathname === "/";
  const { t } = useTranslation();
  const [motionPaused] = useMotionPaused();

  const [theme] = useTheme();

  // Accueil sur téléphone : le défilement s'arrête sur chaque projet (cf. globals.css).
  useEffect(() => {
    document.documentElement.classList.toggle("home-snap", isHome);
    return () => document.documentElement.classList.remove("home-snap");
  }, [isHome]);

  // Thème clair ou sombre, appliqué avant la peinture.
  useLayoutEffect(() => applyTheme(theme), [theme]);

  return (
    // En pause, framer-motion réduit tous les mouvements comme le ferait le
    // réglage système : glissements et déplacements deviennent instantanés.
    <MotionConfig reducedMotion={motionPaused ? "always" : "user"}>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:text-black"
      >
        {t.site.nav.skipToContent}
      </a>

      <SiteHeader />

      <AnimatePresence>{!isHome ? <FixedBackButton key="back" /> : null}</AnimatePresence>

      <main id="contenu" tabIndex={-1} className="portfolio-main focus:outline-none">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Sur l'accueil, la mention de droits flotte sur la galerie (cf. GalleryHome). */}
      {!isHome ? <SiteFooter /> : null}

      <ScrollToTop />

      <Veil />

      {/* Rideau d'ouverture, hors de la zone animée pour couvrir aussi l'en-tête. */}
      <Opening />
    </MotionConfig>
  );
}
