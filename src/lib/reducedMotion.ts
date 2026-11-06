"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/**
 * Réglage système « réduire les animations », suivi en direct : s'il change
 * pendant la visite, le site suit aussitôt.
 *
 * À utiliser à la place de `useReducedMotion` de framer-motion, qui renvoie la
 * vraie valeur dès le premier rendu client alors que le serveur ne la connaît
 * pas : le rendu différait à l'hydratation, et React signalait une erreur. Ici,
 * `false` pendant l'hydratation, comme le serveur, puis la vraie valeur juste
 * après.
 *
 * Ce second rendu ne doit pas changer le type d'un élément : React recréerait
 * tout ce qu'il contient (cf. ScrollRevealGroup). Les entrées (`initial`) ne
 * rejouent pas pour autant : au premier chargement, `AnimatePresence
 * initial={false}` de PageTransition les bloque pour tout le contenu de la page.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
