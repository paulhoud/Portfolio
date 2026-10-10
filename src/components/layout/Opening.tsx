"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
// Chargé sur toutes les pages avec le rideau : la remise à zéro de l'accueil
// (clic sur le logo, actualisation) doit être prête partout.
import "@/lib/homeReset";
import { useMotionPaused } from "@/lib/motionPause";
import { endOpening, useOpening } from "@/lib/opening";
import { cn } from "@/lib/utils";

/** Le PH (dessin du logo blanc, 61 × 70). */
const LOGO_PATH =
  "M0 67.5491H4.42604V51.1666H16.4396C31.5569 51.1666 42.2994 43.6843 44.2557 30.6038H56.5739V67.5491H61V2H56.5739V26.3284H44.5761L44.5766 26.1557C44.5766 10.8714 33.1953 2 16.4396 2H0V67.5491ZM4.42604 46.7843H16.6504C17.853 46.7843 19.0183 46.7324 20.1442 46.6297V6.53027C19.0175 6.43183 17.8521 6.38224 16.6504 6.38224H4.42604V46.7843ZM24.5703 30.6038V45.9181C32.9017 43.939 38.3685 38.6281 39.7851 30.6038H24.5703ZM24.5703 26.3284H40.1505L40.1505 26.2626C40.1505 15.992 34.2717 9.42237 24.5703 7.2122V26.3284Z";

/** Filet : la galerie ne retient jamais le rideau plus longtemps (ms depuis l'ouverture de la page). */
const SAFETY_MS = 8000;

/**
 * Rideau d'ouverture de l'accueil (cf. lib/opening) : fond noir, le PH qui
 * se trace puis se remplit, un fin trait qui scintille en attendant. Rendu dès
 * le serveur, il couvre la page avant même que le script ne démarre, et se
 * lève de lui-même au bout de quelques secondes si le script n'arrive pas.
 * Purement décoratif : la page reste lisible dessous pour les lecteurs d'écran.
 */
export function Opening() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const state = useOpening();
  const [paused] = useMotionPaused();

  useEffect(() => {
    // Arrivé ailleurs que sur l'accueil (ou parti pendant l'attente) : plus de rideau.
    if (!isHome) {
      endOpening({ immediate: true });
      return;
    }
    const safety = window.setTimeout(() => endOpening(), Math.max(0, SAFETY_MS - performance.now()));
    return () => window.clearTimeout(safety);
  }, [isHome]);

  if (!isHome || state === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "opening fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#08080b]",
        state === "leaving" && "opening-leave",
        paused && "opening-still",
      )}
    >
      <svg className="opening-mark" viewBox="0 0 61 70" width="61" height="70">
        <path className="opening-trace" d={LOGO_PATH} pathLength={1} fill="none" stroke="currentColor" strokeWidth={0.7} />
        <path className="opening-fill" d={LOGO_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
      <span className="opening-bar" />
    </div>
  );
}
