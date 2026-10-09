"use client";

import { useSyncExternalStore } from "react";
import { isMotionPaused } from "./motionPause";

/**
 * Rideau d'ouverture du site : à l'arrivée sur l'accueil, un écran sobre (le
 * PH qui se dessine) couvre la page le temps que la galerie 3D soit prête,
 * puis s'efface. Il n'a lieu qu'une fois, au chargement du site : arrivé
 * ailleurs, ou revenu sur l'accueil plus tard, on n'attend plus.
 *
 * - « loading » : le rideau couvre l'écran (c'est aussi l'état du rendu serveur) ;
 * - « leaving » : il s'efface, la galerie démarre son arrivée dessous ;
 * - « done » : il n'existe plus.
 */

export type OpeningState = "loading" | "leaving" | "done";

/** Durée de l'effacement (ms), accordée à la transition CSS de `.opening`. */
export const OPENING_LEAVE_MS = 700;
/** Le rideau reste au moins le temps que le logo se dessine (ms depuis l'ouverture de la page). */
const MIN_MS = 1100;
const MIN_CALM_MS = 300;

let state: OpeningState = "loading";
let ending = false;
const listeners = new Set<() => void>();

function set(next: OpeningState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useOpening(): OpeningState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => "loading",
  );
}

/** Lecture ponctuelle, hors React. */
export function isOpening() {
  return state === "loading";
}

/**
 * Lève le rideau : tout de suite (`immediate`), ou dès que le logo a eu le
 * temps de se dessiner. Sans effet s'il est déjà levé ou en train de l'être.
 */
export function endOpening({ immediate = false }: { immediate?: boolean } = {}) {
  if (state === "done") return;
  if (immediate) {
    set("done");
    return;
  }
  if (ending || state !== "loading") return;
  ending = true;
  const calm = isMotionPaused() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = Math.max(0, (calm ? MIN_CALM_MS : MIN_MS) - performance.now());
  window.setTimeout(() => {
    if (state !== "loading") return;
    set("leaving");
    window.setTimeout(() => {
      if (state === "leaving") set("done");
    }, OPENING_LEAVE_MS);
  }, wait);
}
