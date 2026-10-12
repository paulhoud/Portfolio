"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/context";
import { useSoundOn } from "@/lib/sound/sound";
import { flush, setTrackingContext, track } from "@/lib/stats/track";
import { useTheme } from "@/lib/theme";

/**
 * Mesure d'audience (cf. lib/stats) : pages vues, temps passé et défilement,
 * liens sortants, e-mails et téléchargements, réglages changés. Les gestes
 * propres à une page (accueil 3D, contact…) sont envoyés par ces pages
 * elles-mêmes, avec `track`. Rien ne s'affiche.
 */
export function Analytics() {
  const pathname = usePathname();
  const { locale } = useTranslation();
  const [theme] = useTheme();
  const [soundOn] = useSoundOn();
  const page = useRef<{ path: string; start: number; depth: number } | null>(null);
  const firstView = useRef(true);
  /** Part de la page vue jusqu'ici (bas de l'écran rapporté à la hauteur de la page). */
  const measure = useRef(() => {
    const current = page.current;
    if (!current) return;
    const height = document.documentElement.scrollHeight;
    const seen = height > 0 ? Math.min(1, (window.scrollY + window.innerHeight) / height) : 1;
    if (seen > current.depth) current.depth = seen;
  });

  useEffect(() => setTrackingContext({ locale, theme }), [locale, theme]);

  // Page quittée : temps passé (onglet visible seulement) et défilement atteint.
  // Un onglet caché arrête le compteur (start infini) jusqu'à son retour.
  const leave = useRef((keep: boolean) => {
    const current = page.current;
    if (!current) return;
    if (Number.isFinite(current.start)) {
      const seconds = Math.min((performance.now() - current.start) / 1000, 1800);
      track("leave", String(Math.round(current.depth * 100)), seconds, { path: current.path });
    }
    page.current = keep ? { ...current, start: Number.POSITIVE_INFINITY } : null;
  });

  useEffect(() => {
    const previous = page.current?.path;
    leave.current(false);
    let referrer: string | undefined;
    if (firstView.current) {
      firstView.current = false;
      try {
        const from = document.referrer ? new URL(document.referrer) : null;
        if (from && from.host !== window.location.host) referrer = from.hostname.replace(/^www\./, "");
      } catch {
        /* adresse illisible : pas de provenance */
      }
    }
    track("view", previous, undefined, { path: pathname, referrer });
    page.current = { path: pathname, start: performance.now(), depth: 0 };
    // Une page courte se lit sans défiler : on mesure aussi ce qui est à
    // l'écran, une fois la page en place.
    const settle = window.setTimeout(() => measure.current(), 1200);
    return () => window.clearTimeout(settle);
  }, [pathname]);

  // Défilement atteint (part de la page vue), et départ (onglet caché ou fermé).
  useEffect(() => {
    const onScroll = () => measure.current();
    // Onglet caché ou page fermée : l'onglet peut ne jamais revenir, on
    // envoie tout de suite. S'il revient, le temps repart pour cette page.
    const onHide = () => {
      leave.current(true);
      flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
      else if (page.current && !Number.isFinite(page.current.start)) page.current.start = performance.now();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // Liens : sites extérieurs, messagerie, téléchargements.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("mailto:")) track("contact", "write");
      else if (link.hasAttribute("download")) track("download", href.split("/").pop());
      else if (link.host && link.host !== window.location.host) track("outbound", link.hostname.replace(/^www\./, ""));
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // Réglages changés (pas leur valeur au chargement).
  const settings = useRef<{ theme: string; locale: string; sound: boolean } | null>(null);
  useEffect(() => {
    const before = settings.current;
    settings.current = { theme, locale, sound: soundOn };
    if (!before) return;
    if (before.theme !== theme) track("theme", theme);
    if (before.locale !== locale) track("lang", locale);
    if (before.sound !== soundOn) track("sound", soundOn ? "on" : "off");
  }, [theme, locale, soundOn]);

  return null;
}
