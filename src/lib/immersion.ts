"use client";

import { useSyncExternalStore } from "react";

/**
 * Coordination de l'entrée dans un projet depuis la galerie 3D, et du retour.
 *
 * - Type de transition : la page suivante arrive soit en glissant (par
 *   défaut), soit d'un coup (« cut ») quand la galerie a déjà fait le
 *   mouvement elle-même (la caméra entre dans la plaque).
 * - Voile : un aplat plein écran à la couleur du projet, qui couvre le
 *   changement de page puis s'efface.
 * - Retour : le projet dont on revient, pour que la galerie reparte de
 *   l'intérieur de sa plaque et recule jusqu'à sa place.
 */

export type TransitionKind = "slide" | "cut";

let nextTransition: { path: string; kind: TransitionKind; at: number } | null = null;

/** À appeler juste avant de naviguer vers `path`. */
export function setNextTransition(path: string, kind: TransitionKind) {
  nextTransition = { path, kind, at: performance.now() };
}

/** Type de transition pour l'arrivée sur `path` (valable quelques secondes). */
export function transitionFor(path: string): TransitionKind {
  if (!nextTransition || nextTransition.path !== path) return "slide";
  return performance.now() - nextTransition.at < 6000 ? nextTransition.kind : "slide";
}

// --- Voile -------------------------------------------------------------------

export type VeilState = { color: string; visible: boolean; duration: number };

let veil: VeilState = { color: "#000000", visible: false, duration: 0 };
const veilListeners = new Set<() => void>();
let veilSafety = 0;

function setVeil(next: VeilState) {
  veil = next;
  for (const listener of veilListeners) listener();
}

/** Couvre l'écran de `color` ; la promesse se résout une fois le voile opaque. */
export function showVeil(color: string, duration = 220): Promise<void> {
  setVeil({ color, visible: true, duration });
  // Filet : un voile ne reste jamais affiché si la suite n'arrive pas.
  window.clearTimeout(veilSafety);
  veilSafety = window.setTimeout(() => hideVeil(400), 4000);
  return new Promise((resolve) => window.setTimeout(resolve, duration + 20));
}

export function hideVeil(duration = 450) {
  window.clearTimeout(veilSafety);
  if (!veil.visible) return;
  setVeil({ ...veil, visible: false, duration });
}

export function useVeil(): VeilState {
  return useSyncExternalStore(
    (listener) => {
      veilListeners.add(listener);
      return () => {
        veilListeners.delete(listener);
      };
    },
    () => veil,
    () => veil,
  );
}

/** Attend que la navigation vers `path` soit affichée, puis lève le voile. */
export function revealWhenOn(path: string, duration = 450) {
  const startedAt = performance.now();
  const check = () => {
    if (window.location.pathname === path) {
      // Deux images : la nouvelle page est peinte sous le voile.
      requestAnimationFrame(() => requestAnimationFrame(() => hideVeil(duration)));
    } else if (performance.now() - startedAt < 4000) {
      requestAnimationFrame(check);
    } else {
      hideVeil(duration);
    }
  };
  requestAnimationFrame(check);
}

// --- Retour vers la galerie ----------------------------------------------------

let galleryReturn: { slug: string; at: number } | null = null;

/** Le prochain affichage de la galerie part de l'intérieur de cette plaque. */
export function requestGalleryReturn(slug: string) {
  galleryReturn = { slug, at: performance.now() };
}

/** Retour demandé, s'il est récent (sans le consommer : cf. clearGalleryReturn). */
export function peekGalleryReturn(): string | null {
  if (!galleryReturn || performance.now() - galleryReturn.at > 6000) return null;
  return galleryReturn.slug;
}

export function clearGalleryReturn() {
  galleryReturn = null;
}
