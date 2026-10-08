"use client";

import { useSyncExternalStore } from "react";

/**
 * Affichage de l'accueil : la grille actuelle ou la galerie (exploration en
 * cours sur la branche nav-immersive).
 *
 * Le choix est mémorisé. `?galerie=1` ou `?grille=1` dans l'adresse l'imposent
 * et l'enregistrent, pour pouvoir partager un lien vers l'une ou l'autre vue.
 * Au rendu serveur, c'est toujours la grille : elle reste la version de
 * référence, lisible sans JavaScript.
 */

export type HomeView = "grid" | "gallery";

const STORAGE_KEY = "portfolio-home-view";
const listeners = new Set<() => void>();
let memory: HomeView = "grid";
let urlApplied = false;

function applyUrlOnce() {
  if (urlApplied) return;
  urlApplied = true;
  const params = new URLSearchParams(window.location.search);
  if (params.has("galerie")) store("gallery");
  else if (params.has("grille")) store("grid");
}

function store(view: HomeView) {
  memory = view;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* stockage indisponible : le choix vaut pour cette page seulement */
  }
}

function getSnapshot(): HomeView {
  applyUrlOnce();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "gallery" || saved === "grid") return saved;
  } catch {
    /* ignore */
  }
  return memory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setHomeView(view: HomeView) {
  store(view);
  for (const listener of listeners) listener();
}

export function useHomeView(): HomeView {
  return useSyncExternalStore(subscribe, getSnapshot, () => "grid");
}
