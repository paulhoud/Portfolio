"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { isHomePath, splitLocalePath } from "@/i18n/paths";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { transitionFor, type TransitionKind } from "@/lib/immersion";
import { usePrefersReducedMotion } from "@/lib/reducedMotion";
import { FrozenRouter } from "./FrozenRouter";

/**
 * Transition entre les pages. Trois mouvements, selon ce qui change :
 *
 * - Fondu (« fade ») dès qu'une page de lecture est en jeu (méthode, à propos,
 *   contact, CV, Book, mentions légales), demande de Paul du 6 nov. 2026 : ces
 *   pages ne sont pas une pile de fiches, le glissement n'y avait pas de sens
 *   (d'une page à l'autre, les deux partaient même du même côté et se
 *   croisaient). L'ancienne page s'efface vite, puis la nouvelle apparaît :
 *   leurs textes ne se superposent jamais. Le damier, lui, reste plein dessous.
 *   L'en-tête ne bouge pas, et le contenu fait sa propre entrée (cf. ScrollReveal).
 * - Glissement (« slide ») entre le damier et un projet, quand la caméra ne
 *   fait pas le mouvement (retour du navigateur) : le projet est un calque qui
 *   recouvre le damier et repart du même côté.
 * - Coupe (« cut ») entre la galerie 3D et un projet : c'est la caméra qui fait
 *   le mouvement (elle entre dans la plaque, ou en ressort) sous un voile de
 *   couleur, et les calques s'échangent d'un coup (cf. lib/immersion).
 *
 * Les calques occupent la même cellule de grille (cf. `globals.css`), ce qui
 * les superpose sans positionnement absolu ni recalcul de mise en page.
 * {@link FrozenRouter} fige le contenu du calque sortant le temps de l'animation.
 */

type PageKind = TransitionKind | "fade";
type Move = { kind: PageKind; toBase: boolean };

/** Le damier et les projets glissent entre eux ; tout le reste se fond. */
function moveBetween(from: string, to: string): PageKind {
  if (transitionFor(to) === "cut") return "cut";
  const plain = [from, to].map((path) => splitLocalePath(path).path);
  const stacked = plain.every((path) => path === "/" || path.startsWith("/projects/"));
  // Changer de langue ne change pas de page : pas de glissement non plus.
  return stacked && plain[0] !== plain[1] ? "slide" : "fade";
}

const instant = { duration: 0 };
const slide = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };
const fadeIn = { duration: 0.3, delay: 0.1, ease: "easeOut" as const };
const fadeOut = { opacity: 0, transition: { duration: 0.14, ease: "easeIn" as const } };
const fadeToHome = { opacity: 0, transition: { duration: 0.28, ease: "easeOut" as const } };
// Le damier reste plein sous la page qui arrive. Un écart imperceptible : sans
// valeur à animer, il serait retiré tout de suite, et le fond apparaîtrait.
const hold = { opacity: 0.999, transition: { duration: 0.4 } };

// Ombre portée du calque qui glisse : seulement pendant le mouvement. Laissée
// en place, elle débordait sous la page et marquait la limite avec le pied de
// page (bien visible en thème clair).
const SLIDE_SHADOW = "-24px 0px 60px rgba(0, 0, 0, 0.45)";
const NO_SHADOW = "0px 0px 0px rgba(0, 0, 0, 0)";

const overlayVariants: Variants = {
  initial: ({ kind }: Move) =>
    kind === "slide" ? { x: "100%", opacity: 1, boxShadow: SLIDE_SHADOW } : { x: 0, opacity: kind === "fade" ? 0 : 1, boxShadow: NO_SHADOW },
  animate: ({ kind }: Move) => ({ x: 0, opacity: 1, boxShadow: NO_SHADOW, transition: kind === "fade" ? fadeIn : slide }),
  exit: ({ kind, toBase }: Move) => {
    if (kind === "cut") return { opacity: 0, transition: instant };
    if (kind === "slide") return { x: "100%", boxShadow: SLIDE_SHADOW, transition: slide };
    return toBase ? fadeToHome : fadeOut;
  },
};

// Le damier s'assombrit sous la page qui le recouvre en glissant, sans changer
// d'échelle : un texte agrandi ou réduit en mouvement se brouille.
const baseVariants: Variants = {
  initial: ({ kind }: Move) => ({ opacity: kind === "slide" ? 0 : 1 }),
  animate: ({ kind }: Move) => ({ opacity: 1, transition: kind === "fade" ? fadeIn : slide }),
  exit: ({ kind }: Move) => {
    if (kind === "cut") return { opacity: 0, transition: instant };
    return kind === "slide" ? { opacity: 0.5, transition: slide } : hold;
  },
};

/**
 * Glissement au pixel entier (cf. ScrollReveal) : en fin d'amorti, la page
 * avançait d'une fraction de pixel par image et son texte scintillait. Arrivée,
 * plus aucune transformation ne reste.
 */
const slideTemplate = ({ x }: { x?: string | number }) => {
  const value = String(x ?? 0);
  const amount = Number.parseFloat(value) || 0;
  const px = Math.round(value.endsWith("%") ? (amount * document.documentElement.clientWidth) / 100 : amount);
  return px ? `translateX(${px}px)` : "none";
};

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Styles posés sur le calque sortant pour le figer à l'écran. */
const PINNED_STYLES = ["position", "top", "left", "width"] as const;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();
  const isBase = isHomePath(pathname);
  const variants = isBase ? baseVariants : overlayVariants;
  // Le mouvement dépend de la page quittée : établi une fois, au changement de page.
  const [move, setMove] = useState<Move & { path: string }>({ path: pathname, kind: "cut", toBase: isBase });
  if (move.path !== pathname) setMove({ path: pathname, kind: moveBetween(move.path, pathname), toBase: isBase });

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
      <AnimatePresence initial={false} custom={move}>
        <motion.div
          key={pathname}
          custom={move}
          data-page-path={pathname}
          className="page-transition-layer"
          style={{ zIndex: isBase ? 1 : 2 }}
          variants={reduceMotion ? undefined : variants}
          transformTemplate={slideTemplate}
          initial={reduceMotion ? false : "initial"}
          animate={reduceMotion ? undefined : "animate"}
          exit={reduceMotion ? undefined : "exit"}
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
