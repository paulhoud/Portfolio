"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FixedBackButton } from "./FixedBackButton";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import { Sidebar } from "./Sidebar";

/**
 * Cadre applicatif persistant. Rend la chrome (sidebar, nav mobile, bouton
 * retour fixe, retour-en-haut) EN DEHORS de la zone animée, de sorte qu'elle
 * reste stable pendant les transitions de page, tandis que seul le contenu
 * (`PageTransition`) glisse. Remplace l'ancien `SiteShell` répété page par page.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <Sidebar />
      <MobileNav />

      <AnimatePresence>{!isHome ? <FixedBackButton key="back" /> : null}</AnimatePresence>

      <main className="portfolio-main">
        <PageTransition>{children}</PageTransition>
      </main>

      <ScrollToTop />
    </>
  );
}
