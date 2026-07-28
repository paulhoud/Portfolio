"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` déclenche un avertissement au rendu serveur ; on retombe
 * sur `useEffect` dans ce cas, la restauration n'ayant de sens qu'au client.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Mémorise la position de défilement d'une page et la restaure au retour.
 *
 * Sans cela, revenir au damier depuis une fiche projet ramenait tout en haut :
 * la navigation se fait par `<Link>`, qui empile une nouvelle entrée
 * d'historique et repositionne en haut — ce n'est pas un « retour » au sens du
 * navigateur, donc la restauration native ne s'applique pas.
 *
 * La restauration est déclenchée par le **retour sur le chemin**, et non par le
 * montage du composant : pendant la transition, la page sortante reste affichée
 * le temps de l'animation, et un aller-retour rapide la réactive au lieu de la
 * remonter. Un déclenchement au montage serait alors ignoré.
 *
 * @param path Chemin de la page concernée.
 */
export function useScrollMemory(path: string) {
  const pathname = usePathname();
  const isActive = pathname === path;
  const key = `scroll-memory:${path}`;

  useIsomorphicLayoutEffect(() => {
    if (!isActive) return;

    const stored = window.sessionStorage.getItem(key);
    const target = Number(stored);
    if (!stored || !Number.isFinite(target) || target <= 0) return;

    window.scrollTo(0, target);
    // La navigation peut repositionner la page en haut juste après le rendu :
    // on réapplique la position à la frame suivante.
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, target));
    return () => window.cancelAnimationFrame(frame);
  }, [isActive, key]);

  useEffect(() => {
    if (!isActive) return;

    const save = () => {
      // Garde-fou : l'URL change avant que la page sortante ne disparaisse.
      // Sans cette comparaison, la remise à zéro du défilement provoquée par la
      // navigation écraserait la position mémorisée juste avant de partir.
      if (window.location.pathname !== path) return;
      window.sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [isActive, key, path]);
}
