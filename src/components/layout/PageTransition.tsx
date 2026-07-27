"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
 * `AnimatePresence mode="popLayout"` garde la page entrante dans le flux normal
 * (le scroll fenêtre reste intact) et sort la page sortante du flux pour la
 * superposer. {@link FrozenRouter} fige son contenu le temps de l'animation.
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

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isBase = pathname === "/";
  const variants = isBase ? baseVariants : overlayVariants;

  return (
    <div className="page-transition-viewport">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
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
