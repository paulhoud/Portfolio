"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "./themeBoot";

/**
 * Thème clair ou sombre du site, choisi par le visiteur et mémorisé.
 *
 * Sombre par défaut, comme le reste du site. Le thème clair est un choix
 * explicite du visiteur, jamais déduit du réglage système : arriver de la scène
 * 3D noire sur une page blanche qu'on n'a pas demandée surprendrait.
 *
 * Il vaut aussi pour l'accueil : la scène 3D passe alors sur un fond clair
 * (`GalleryRenderer.setTheme`).
 *
 * Le thème est porté par l'attribut `data-theme` de <html> ; les couleurs qui en
 * dépendent sont des variables CSS (cf. globals.css, `--ink`, `--page`…). Un
 * petit script posé dans <head> l'applique avant le premier affichage, pour
 * qu'une page claire ne s'affiche jamais d'abord en sombre.
 */

export type Theme = "dark" | "light";

const listeners = new Set<() => void>();

// Valeur de secours quand le stockage local est indisponible.
let memory: Theme = "dark";

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

function setTheme(theme: Theme) {
  try {
    if (theme === "light") window.localStorage.setItem(STORAGE_KEY, "light");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : le réglage vaut pour cette page seulement */
  }
  memory = theme;
  for (const listener of listeners) listener();
}

function getSnapshot(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return memory;
  }
}

/** `[thème choisi, basculer]` - sombre au rendu serveur. */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark" as const);
  const toggle = useCallback(() => setTheme(getSnapshot() === "light" ? "dark" : "light"), []);
  return [theme, toggle];
}

/** Applique le thème au document. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
}
