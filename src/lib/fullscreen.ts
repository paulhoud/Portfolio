"use client";

import { useSyncExternalStore } from "react";

/**
 * Plein écran du site (idée de Paul, 29 oct. 2026) : tout le document passe
 * en plein écran, comme avec F11, et la touche Échap en sort. La navigation
 * d'une page à l'autre le garde ; un rechargement complet en sort (règle des
 * navigateurs).
 *
 * Indisponible sur iPhone, où Safari ne le permet que pour les vidéos : le
 * bouton ne s'y affiche pas. Safari plus ancien (Mac, iPad) : fonctions
 * préfixées `webkit`.
 */

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const EVENTS = ["fullscreenchange", "webkitfullscreenchange"];

function subscribe(listener: () => void) {
  EVENTS.forEach((name) => document.addEventListener(name, listener));
  return () => EVENTS.forEach((name) => document.removeEventListener(name, listener));
}

function getSnapshot() {
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

function getSupport() {
  const doc = document as WebkitDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

const still = () => () => {};

function toggleFullscreen() {
  const doc = document as WebkitDocument;
  const root = document.documentElement as WebkitElement;
  try {
    const result = getSnapshot()
      ? doc.exitFullscreen
        ? doc.exitFullscreen()
        : doc.webkitExitFullscreen?.()
      : root.requestFullscreen
        ? root.requestFullscreen({ navigationUI: "hide" })
        : root.webkitRequestFullscreen?.();
    // Refus du navigateur (réglage, page intégrée) : rien ne change, sans erreur.
    if (result instanceof Promise) result.catch(() => {});
  } catch {
    /* idem */
  }
}

/** `[disponible, en plein écran, basculer]` - indisponible au rendu serveur. */
export function useFullscreen(): [boolean, boolean, () => void] {
  const supported = useSyncExternalStore(still, getSupport, () => false);
  const active = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return [supported, active, toggleFullscreen];
}
