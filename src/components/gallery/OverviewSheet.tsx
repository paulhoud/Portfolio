"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import type { Project } from "@/content/projects";
import { useTranslation } from "@/i18n/context";
import { lockPageScroll } from "@/lib/scrollLock";

const noopSubscribe = () => () => {};

/**
 * « Vue d'ensemble » de la galerie : la grille des onze projets dans une
 * feuille plein écran.
 *
 * Rendue dans `document.body` : à l'intérieur du calque de transition (qui
 * forme son propre empilement), elle passait sous le header, et la transformée
 * appliquée à ce calque pendant une navigation l'aurait étirée. Tant qu'elle
 * est ouverte, le reste de la page est rendu inerte : ni clic ni Tab ne
 * peuvent y atteindre. Échap ou le bouton la referment, et le focus revient là
 * où il était.
 */
export function OverviewSheet({
  open,
  onClose,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();

    // Tout ce qui n'est pas la feuille devient inerte le temps de son ouverture.
    const inerted: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (child instanceof HTMLElement && !child.contains(rootRef.current) && !child.inert) {
        child.inert = true;
        inerted.push(child);
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      for (const element of inerted) element.inert = false;
      unlock();
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={rootRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.site.gallery.overview}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#17161d]"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="fixed right-4 top-4 z-10 flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 text-xs uppercase tracking-[0.12em] text-white/85 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 lg:right-6 lg:top-6"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            {t.site.gallery.close}
          </button>
          {/* Un clic sur une tuile ouvre le projet : la feuille se ferme d'abord. */}
          <div onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a[href]")) onClose(); }}>
            <ProjectGrid projects={projects} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
