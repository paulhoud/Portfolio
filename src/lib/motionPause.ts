"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Réglage « animations en pause », choisi par le visiteur et mémorisé.
 *
 * Il coupe tout ce qui bouge sans qu'on le demande : animations automatiques
 * des tuiles, boucles des logos, séquences d'arrivée. Ce que le visiteur
 * déclenche lui-même (survol, clic) continue de fonctionner. C'est l'équivalent
 * à la demande du réglage système « réduire les animations ».
 */

const STORAGE_KEY = "portfolio-motion-paused";
const listeners = new Set<() => void>();

// Valeur de secours quand le stockage local est indisponible.
let memory = false;

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Un changement fait dans un autre onglet s'applique aussi ici.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setMotionPaused(paused: boolean) {
  try {
    if (paused) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : le réglage vaut pour cette page seulement */
  }
  memory = paused;
  for (const listener of listeners) listener();
}

function getSnapshot() {
  try {
    return read() || memory;
  } catch {
    return memory;
  }
}

/** `[pause, basculer]` — faux au rendu serveur. */
export function useMotionPaused(): [boolean, () => void] {
  const paused = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => setMotionPaused(!getSnapshot()), []);
  return [paused, toggle];
}

/** Lecture ponctuelle, hors React (contrôleurs, effets). */
export function isMotionPaused() {
  return typeof window !== "undefined" && getSnapshot();
}

/** Abonnement hors React. */
export const subscribeMotionPaused = subscribe;
