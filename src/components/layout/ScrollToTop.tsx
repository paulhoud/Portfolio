"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";

const SCROLL_THRESHOLD_PX = 240;

/**
 * Bouton flottant « retour en haut » (bas-droite). Apparaît dès que la page est
 * défilée au-delà d'un seuil, remonte en douceur, et s'anime à l'apparition
 * comme à la disparition.
 */
export function ScrollToTop() {
  const { locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const label = locale === "en" ? "Back to top" : "Remonter en haut";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label={label}
          title={label}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="group fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
