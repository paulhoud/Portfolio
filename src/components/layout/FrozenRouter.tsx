"use client";

import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext, useState, type ReactNode } from "react";

/**
 * Fige le contexte du routeur App Router pour le sous-arbre enfant.
 *
 * Pendant une transition de page, framer-motion conserve l'ancienne page dans
 * le DOM le temps de l'animation de sortie. Sans ce gel, Next.js remplacerait
 * immédiatement son contenu par celui de la nouvelle route (les deux calques
 * afficheraient la même page). En capturant le contexte au montage, le calque
 * sortant continue d'afficher la page qui était active — indispensable pour une
 * transition sans clignotement.
 */
export function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  // Capture le contexte au premier rendu et l'ignore ensuite : le calque sortant
  // continue d'afficher l'ancienne page pendant l'animation de sortie.
  const [frozen] = useState(context);

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}
