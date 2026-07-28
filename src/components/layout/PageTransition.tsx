"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { FrozenRouter } from "./FrozenRouter";

/**
 * Transition immersive entre le damier et les sous-pages.
 *
 * Modèle : les sous-pages (projets, méthode, à propos, contact) forment un
 * calque « overlay » qui glisse depuis la droite (z-index haut, ombre portée) ;
 * le damier est le calque de base qui reste en place et recule légèrement quand
 * il est recouvert. À l'ouverture la page recouvre le damier ; au retour elle
 * glisse vers la droite et le damier réapparaît dessous — animation exactement
 * inverse.
 *
 * Les deux calques occupent la même cellule de grille (cf. `globals.css`), ce
 * qui les superpose sans positionnement absolu ni recalcul de mise en page.
 * {@link FrozenRouter} fige le contenu du calque sortant le temps de l'animation.
 */

const overlayVariants: Variants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

const baseVariants: Variants = {
  initial: { opacity: 0, scale: 1.01 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0.5, scale: 0.96 },
};

const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Styles posés sur le calque sortant pour le figer à l'écran. */
const PINNED_STYLES = ["position", "top", "left", "width"] as const;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isBase = pathname === "/";
  const variants = isBase ? baseVariants : overlayVariants;

  const viewportRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(pathname);
  const scrollRef = useRef(0);

  // Dernière position de défilement connue : la navigation remet la page en
  // haut avant que l'on puisse la lire, il faut donc la suivre en continu.
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Fige le calque sortant à l'endroit exact où il se trouvait à l'écran.
   *
   * Sans cela, la remise à zéro du défilement déclenchée par la navigation
   * s'appliquait à la page sortante encore visible : on voyait le damier
   * remonter jusqu'au premier projet pendant que la fiche se mettait en place.
   * En le passant en `fixed`, il reste immobile et se contente de s'effacer.
   */
  useIsomorphicLayoutEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    const root = viewportRef.current;
    if (!root || previousPath === pathname) return;

    const layers = root.querySelectorAll<HTMLElement>("[data-page-path]");
    for (const layer of layers) {
      if (layer.dataset.pagePath === previousPath) {
        const rect = layer.getBoundingClientRect();
        // Position dans le document, stable que le défilement ait déjà été
        // réinitialisé ou non.
        const documentTop = rect.top + window.scrollY;
        const scrolled = window.scrollY || scrollRef.current;

        layer.style.position = "fixed";
        layer.style.top = `${documentTop - scrolled}px`;
        layer.style.left = `${rect.left}px`;
        layer.style.width = `${rect.width}px`;
      } else {
        // Un aller-retour rapide peut réactiver un calque encore en sortie :
        // il doit alors retrouver son comportement normal.
        for (const property of PINNED_STYLES) layer.style.removeProperty(property);
      }
    }
  }, [pathname]);

  return (
    <div ref={viewportRef} className="page-transition-viewport">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          data-page-path={pathname}
          className="page-transition-layer"
          style={{
            zIndex: isBase ? 1 : 2,
            boxShadow: isBase ? undefined : "-24px 0 60px rgba(0, 0, 0, 0.45)",
          }}
          variants={reduceMotion ? undefined : variants}
          initial={reduceMotion ? false : "initial"}
          animate={reduceMotion ? undefined : "animate"}
          exit={reduceMotion ? undefined : "exit"}
          transition={transition}
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
