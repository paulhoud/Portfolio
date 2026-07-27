"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations } from "./catalog";
import { defaultLocale, type Locale, type Translations } from "./types";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const storageKey = "portfolio-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "fr" || stored === "en") {
      // Restore persisted locale after hydration without blocking first paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only preference sync
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    // Seule la langue du document est synchronisée : le <title> est géré par
    // les metadata Next, page par page. L'écraser ici replaçait le titre
    // générique du site sur toutes les pages après hydratation.
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(storageKey, nextLocale);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: translations[locale],
    }),
    [locale, setLocale],
  );

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
