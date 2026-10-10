"use client";

import { peekGalleryReturn } from "./immersion";

/**
 * Remise à zéro de l'accueil : l'expérience repart du premier projet, avec
 * son arrivée (demande de Paul, 10 oct. 2026).
 * - au chargement de la page d'accueil (premier accès ou actualisation), la
 *   position mémorisée est oubliée et le navigateur ne la restaure pas ;
 * - à un clic sur un lien vers l'accueil (le logo, « Accueil » du menu) : déjà
 *   sur l'accueil, il repart du début sans changer de page (cf. GalleryHome) ;
 *   ailleurs, on y arrive au premier projet.
 * Le retour d'un projet (bouton retour) ramène toujours au projet quitté.
 *
 * Chargé sur toutes les pages par le rideau d'ouverture (cf. Opening).
 */

const RESET_EVENT = "portfolio:home-reset";
/** Clés de session qui marquent une visite déjà avancée (cf. GalleryHome). */
const SESSION_KEYS = ["scroll-memory:/", "portfolio-gallery-arrived", "portfolio-gallery-scrolled"];

function forget() {
  try {
    for (const key of SESSION_KEYS) window.sessionStorage.removeItem(key);
  } catch {
    /* stockage indisponible : rien n'a été mémorisé */
  }
}

if (typeof window !== "undefined") {
  const entry = window.performance?.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  const firstPath = entry ? new URL(entry.name).pathname : window.location.pathname;
  // Accueil chargé ou actualisé : on repart du début. Le navigateur ne doit
  // pas remettre l'ancienne position ; il reprend la main une fois la page là.
  if (firstPath === "/" && window.location.pathname === "/" && !window.location.hash) {
    forget();
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
      const giveBack = () => window.setTimeout(() => (window.history.scrollRestoration = "auto"), 0);
      if (document.readyState === "complete") giveBack();
      else window.addEventListener("load", giveBack, { once: true });
    }
    window.scrollTo(0, 0);
  }

  // Clic sur un lien vers l'accueil (capturé avant tout le reste).
  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.getAttribute("href") !== "/" || link.getAttribute("target") === "_blank") return;
      if (window.location.pathname === "/") {
        event.preventDefault();
        forget();
        window.dispatchEvent(new Event(RESET_EVENT));
        return;
      }
      // Ailleurs : une fois le clic traité (le bouton retour d'un projet
      // demande alors à y revenir), on oublie la position, sauf pour ce retour.
      queueMicrotask(() => {
        if (!peekGalleryReturn()) forget();
      });
    },
    true,
  );
}

/** L'accueil écoute la remise à zéro demandée depuis l'accueil même. */
export function onHomeReset(listener: () => void) {
  window.addEventListener(RESET_EVENT, listener);
  return () => window.removeEventListener(RESET_EVENT, listener);
}
