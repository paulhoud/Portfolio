"use client";

import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext, useState, type ReactNode } from "react";

/**
 * Fige le contexte du routeur App Router pour le sous-arbre enfant.
 *
 * Pendant une transition de page, framer-motion conserve l'ancienne page dans
 * le DOM le temps de l'animation de sortie. Sans ce gel, Next.js remplacerait
 * immédiatement son contenu par celui de la nouvelle route (les deux calques
 * afficheraient la même page). Le calque sortant continue donc d'afficher la
 * page qui était active - indispensable pour une transition sans clignotement.
 *
 * Seul le calque sortant est figé : tant que l'adresse reste celle de son
 * calque, le contexte suit le routeur. Sinon, une navigation sur la même page
 * (paramètres de l'adresse, rafraîchissement après une action serveur)
 * n'aurait jamais rien changé à l'écran.
 */
export function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const pathname = usePathname();
  const [own] = useState(pathname);
  const active = pathname === own;
  // Dernier contexte connu du calque tant qu'il était à l'écran.
  const [kept, setKept] = useState(context);
  if (active && kept !== context) setKept(context);

  return <LayoutRouterContext.Provider value={active ? context : kept}>{children}</LayoutRouterContext.Provider>;
}
