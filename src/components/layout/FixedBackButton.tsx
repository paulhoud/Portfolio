"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/i18n/context";

/**
 * Bouton retour fixe, rendu hors de la zone animée (dans AppFrame) afin de
 * rester réellement épinglé au viewport pendant le scroll et les transitions.
 * Positionné en haut à gauche de la zone de contenu, avec une marge cohérente
 * et sans recouvrir le contenu (qui est centré).
 */
export function FixedBackButton({ href = "/" }: { href?: string }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-4 top-[84px] z-40 md:left-[calc(var(--sidebar-width)+1.25rem)] md:top-7"
    >
      <Link
        href={href}
        aria-label={t.site.common.back}
        className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
    </motion.div>
  );
}
