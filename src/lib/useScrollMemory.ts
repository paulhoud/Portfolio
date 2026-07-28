"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * `useLayoutEffect` déclenche un avertissement au rendu serveur ; on retombe
 * sur `useEffect` dans ce cas, la restauration n'ayant de sens qu'au client.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Nombre de frames pendant lesquelles on réessaie d'atteindre la position visée. */
const MAX_RESTORE_FRAMES = 12;

/**
 * Mémorise la position de défilement d'une page et la restaure au retour.
 *
 * Sans cela, revenir au damier depuis une fiche projet ramenait tout en haut :
 * la navigation se fait par `<Link>`, qui empile une nouvelle entrée
 * d'historique et repositionne en haut — ce n'est pas un « retour » au sens du
 * navigateur, donc la restauration native ne s'applique pas.
 *
 * Deux précautions rendent l'opération fiable :
 *
 * 1. La restauration est déclenchée par le **retour sur le chemin**, et non par
 *    le montage du composant : pendant la transition, la page sortante reste
 *    affichée le temps de l'animation, et un aller-retour rapide la réactive au
 *    lieu de la remonter — un déclenchement au montage serait alors ignoré.
 *
 * 2. Elle est **réessayée sur quelques frames**. Au moment du rendu, la hauteur
 *    du document n'est pas toujours définitive ; le navigateur tronque alors le
 *    défilement à ce qui est atteignable, et la page se fige à mi-chemin.
 *
 * @param path Chemin de la page concernée.
 */
export function useScrollMemory(path: string) {
  const pathname = usePathname();
  const isActive = pathname === path;
  const key = `scroll-memory:${path}`;
  const isRestoringRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!isActive) return;

    const stored = window.sessionStorage.getItem(key);
    const target = Number(stored);
    if (!stored || !Number.isFinite(target) || target <= 0) return;

    let frame = 0;
    let handle = 0;
    isRestoringRef.current = true;

    const apply = () => {
      window.scrollTo(0, target);
      frame += 1;

      // Tant que la position visée n'est pas atteinte, c'est que le document
      // n'a pas encore sa hauteur finale : on retente à la frame suivante.
      if (Math.round(window.scrollY) !== target && frame < MAX_RESTORE_FRAMES) {
        handle = window.requestAnimationFrame(apply);
      } else {
        isRestoringRef.current = false;
      }
    };

    apply();

    return () => {
      window.cancelAnimationFrame(handle);
      isRestoringRef.current = false;
    };
  }, [isActive, key]);

  useEffect(() => {
    if (!isActive) return;

    const save = () => {
      // Pendant une restauration, les positions intermédiaires sont tronquées :
      // les enregistrer écraserait la position mémorisée par une valeur fausse.
      if (isRestoringRef.current) return;
      // L'URL change avant que la page sortante ne disparaisse : sans cette
      // comparaison, la remise à zéro provoquée par la navigation écraserait la
      // position mémorisée juste avant de quitter la page.
      if (window.location.pathname !== path) return;

      window.sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [isActive, key, path]);
}
