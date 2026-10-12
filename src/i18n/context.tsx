"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { flush, track } from "@/lib/stats/track";
import { translations } from "./catalog";
import { localePath, splitLocalePath } from "./paths";
import type { Locale, Translations } from "./types";

type LanguageContextValue = {
  locale: Locale;
  /** Passe à l'autre langue : la même page, à son adresse dans cette langue. */
  setLocale: (locale: Locale) => void;
  /** Adresse d'un chemin du site dans la langue courante (« /about » → « /en/about »). */
  href: (path: string) => string;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Langue de la page, fixée par son adresse (cf. paths.ts) : chaque langue a sa
 * propre mise en page racine, qui la donne ici. Changer de langue charge la
 * même page à son adresse dans l'autre langue (rechargement complet : la
 * langue du document et ses métadonnées changent avec elle).
 */
export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      const { path } = splitLocalePath(window.location.pathname);
      track("lang", next);
      flush();
      window.location.assign(localePath(path, next) + window.location.search + window.location.hash);
    },
    [locale],
  );

  const href = useCallback((path: string) => localePath(path, locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, href, t: translations[locale] }), [locale, setLocale, href]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}

/** Chemin de la page courante, sans la langue (« /en/about » → « /about »). */
export function usePagePath() {
  return splitLocalePath(usePathname()).path;
}
