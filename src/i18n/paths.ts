import type { Locale } from "./types";

/**
 * Adresses par langue : le français aux adresses historiques (« /about »),
 * l'anglais sous « /en » (« /en/about »). Chaque langue a ses propres pages,
 * que les moteurs de recherche indexent séparément.
 *
 * Partout où le code compare l'adresse courante (« est-on sur l'accueil ? »),
 * il compare le chemin sans la langue (`splitLocalePath`) ; partout où il
 * fabrique un lien interne, il passe par `localePath`.
 */

export const EN_PREFIX = "/en";

/** Langue d'une adresse et chemin sans la langue (« /en/about » → en, « /about »). */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  if (pathname === EN_PREFIX) return { locale: "en", path: "/" };
  if (pathname.startsWith(`${EN_PREFIX}/`)) return { locale: "en", path: pathname.slice(EN_PREFIX.length) };
  return { locale: "fr", path: pathname };
}

/** Adresse d'un chemin dans une langue (« /about », en → « /en/about »). */
export function localePath(path: string, locale: Locale): string {
  if (locale === "fr") return path;
  return path === "/" ? EN_PREFIX : `${EN_PREFIX}${path}`;
}

/** L'adresse est-elle un accueil, dans l'une ou l'autre langue ? */
export function isHomePath(pathname: string): boolean {
  return splitLocalePath(pathname).path === "/";
}

/**
 * Versions d'une page dans chaque langue, pour les métadonnées (balises
 * hreflang) : le français sert aussi de version par défaut.
 */
export function languageAlternates(path: string) {
  return {
    fr: localePath(path, "fr"),
    en: localePath(path, "en"),
    "x-default": localePath(path, "fr"),
  };
}
